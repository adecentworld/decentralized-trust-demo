const cytoscape = require('cytoscape');
const models = require("./models");
const World = require("./world");

const TOTAL_USERS = 30;
const TOTAL_EDGES = 100;

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
    hexColorString += Math.floor(255 - Math.abs(trustLevel) / 100 * 255).toString(16); // G
    hexColorString += Math.floor(255 - Math.abs(trustLevel) / 100 * 255).toString(16); // B
  } else {
    hexColorString += Math.floor(255 - Math.abs(trustLevel) / 100 * 255).toString(16); // R
    hexColorString += (255).toString(16);
    hexColorString += Math.floor(255 - Math.abs(trustLevel) / 100 * 255).toString(16); // B
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
        'label': 'data(id)'
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

    // Set node circle positions based on location 
    cy.getElementById(userId).data('trustDegree', 4);
    Object.keys(trustRatings).forEach((userId) => {
      if (cy.getElementById(userId).data('trustDegree') != 1) return;
      cy.getElementById(userId).data('trustDegree', 3);
      // Friends of Friends
      const friend = usersMap[userId];
      console.log("Friend of userId ", userId, " is : ", friend)
      const friendsTrustRatings = friend.getTrustRatings();
      Object.keys(friendsTrustRatings).forEach((userId) => {
        if (cy.getElementById(userId).data('trustDegree') != 1) return;
        cy.getElementById(userId).data('trustDegree', 2);
      });
    });

    // Set colors based on Trust Levels
    const trustLevels = user.recalculateTrust();
    console.log("Trust levels: ", trustLevels);
    Object.entries(trustLevels).forEach(([userId, trustLevel]) => {
      let backgroundColor = getHexColorForTrustLevel(trustLevel);
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
      }
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