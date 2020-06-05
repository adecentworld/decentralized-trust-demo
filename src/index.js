const cytoscape = require('cytoscape');
const models = require("./models");
const World = require("./world");

const TOTAL_USERS = 30;
const TOTAL_EDGES = 150;

const world = new World();
const canvas = document.getElementById("cy");

function createUsersHashMap(users) {
  const usersMap = {};
  users.forEach((user) => {
    usersMap[user.id] = user;
  });
  return usersMap;
}

function convertUsersToGraphElements(users, rootUser) {
  const graphElements = {
    nodes: [],
    edges: []
  };
  users.forEach((user) => {
    graphElements.nodes.push({
      data: { 
        id: user.id,
        trustDegree: Math.floor(Math.random() * 4)
      }
    });
    Object.entries(user.trustedUsers).forEach(([userId, trust]) => {
      graphElements.edges.push({
        data: { 
          id: user.id + userId, 
          source: user.id, 
          target: userId 
        }
      });
    });
  })
  return graphElements;
}

function pad(num, size){ return ('000000000' + num).substr(-size); }

/** Returns an appropriate color for a trust rating
 * -100 = Dark Red
 * -50 = Light Red
 * 0 = White
 * 50 = Light Green
 * 100 = Dark Green
 */
function getHexColorForTrustLevel(trustLevel) {
  let hexColorString = "#";
  if (trustLevel < 0) {
    hexColorString += (255).toString(16);
    hexColorString += pad(Math.floor(255 - Math.abs(trustLevel) / 100 * 255).toString(16), 2); // G
    hexColorString += pad(Math.floor(255 - Math.abs(trustLevel) / 100 * 255).toString(16), 2); // B
  } else {
    hexColorString += pad(Math.floor(255 - Math.abs(trustLevel) / 100 * 255).toString(16), 2); // R
    hexColorString += (255).toString(16);
    hexColorString += pad(Math.floor(255 - Math.abs(trustLevel) / 100 * 255).toString(16), 2); // B
  }

  return hexColorString;
}

function createGraph(users) {
  const usersMap = createUsersHashMap(users);
  const graphElements = convertUsersToGraphElements(users);
  const graphStyle = [
    {
      selector: 'node',
      style: {
        'background-color': '#666',
        'label': 'data(id)',
        'font-size': '10px',
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 3,
        'line-color': '#c22',
        'target-arrow-color': '#c22',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier'
      }
    }
  ];
  const graphLayout = {
    name: 'concentric',
    concentric: function( node ){
      console.log("Node: ", node.id(), " Trust Degree: ", node.data('trustDegree'), " Degree: ", node.degree());
      console.log("All node settings: ", node);

      return node.degree();
    },
    levelWidth: function( nodes ){
      return 2;
    }
  };
  console.log("Canvas: ", canvas);
  console.log("Graph elements", graphElements);


  const cy = cytoscape({
    container: canvas,
    elements: graphElements,
    style: graphStyle,
    layout: graphLayout
  });

  cy.on('tap', 'node', function(evt){
    var node = evt.target;
    console.log( 'tapped ' + node.id() );
    const userId = node.id();
    const user = usersMap[userId];
    const trustRatings = user.getTrustRatings();

    // Reset nodes to default colors / positions
    Object.keys(usersMap).forEach((userId) => {
      cy.getElementById(userId).data('trustDegree', 1);
      cy.getElementById(userId).style('background-color', '#aaaaaa');
    });

    cy.edges().style({visibility: 'hidden'});

    // Set node circle positions based on location 
    cy.getElementById(userId).data('trustDegree', 4);
    Object.entries(trustRatings).forEach(([friendId, trustRating]) => {
      if (cy.getElementById(friendId).data('trustDegree') < 3) {
        cy.getElementById(friendId).data('trustDegree', 3);
      }
      const edgeId = userId + friendId;

      console.log("Getting line color for friend ", friendId, " trust rating ", trustRating);
      const color = getHexColorForTrustLevel(trustRating);
      cy.getElementById(edgeId).style({
        visibility: 'visible',
        lineColor: color,
        targetArrowColor: color,
      });

      // Friends of Friends
      if (trustRating < 0) return; // Don't show lines to friends of untrusted people
      const friend = usersMap[friendId];
      console.log("Friend of userId ", friendId, " is : ", friend)
      const friendsTrustRatings = friend.getTrustRatings();
      Object.entries(friendsTrustRatings).forEach(([friendOfFriendId, trustRating]) => {
        if (friendOfFriendId == userId) return; // Don't show links back to main user
        if (trustRatings[friendOfFriendId] != null) {
          // Don't show links to immediate friends of user as these are fixed ratings. 
          return;
        }

        cy.getElementById(friendOfFriendId).data('trustDegree', 2);

        const edgeId = friendId + friendOfFriendId;
        console.log("Getting line color for friend ", friendId, " friend of friend ", friendOfFriendId, " trust rating ", trustRating);
        const color = getHexColorForTrustLevel(trustRating);
        cy.getElementById(edgeId).style({
          visibility: 'visible',
          lineColor: color,
          targetArrowColor: color,
        });
      });
    });

    // Set colors based on Trust Levels
    const trustLevels = user.calculateTrust();
    console.log("Trust levels: ", trustLevels);
    Object.entries(trustLevels).forEach(([userId, trustLevel]) => {
      const backgroundColor = getHexColorForTrustLevel(trustLevel);
      console.log("Trust level: ", trustLevel, " color: ", backgroundColor);
      cy.getElementById(userId).style('background-color', backgroundColor)
    });

    // TODO - Change the graph layout to have selected node in the center, friends around, friends of friends around that etc. 
    const layout = cy.elements().layout({
      name: 'concentric',
      concentric: function(node) {
        console.log("Node: ", node.id(), " Trust Degree: ", node.data('trustDegree'));
        return node.data('trustDegree');
      },
      levelWidth: function(nodes) {
        return 1;
      },
      animate: true,
      spacingFactor: 1,
      nodeDimensionsIncludeLabels: true
    });
    // const layout = cy.elements().layout({
    //   name: "random"
    // });
    layout.run();
  });

  // TODO - Recolor the edges based on their trust level

  
}

async function createWorld() {
  const users = await world.generate(TOTAL_USERS, TOTAL_EDGES);
  const rootUser = users[0];
  createGraph(users, rootUser);
}

createWorld();