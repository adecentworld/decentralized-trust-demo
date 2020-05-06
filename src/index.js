const cytoscape = require('cytoscape');
const models = require("./models");
const World = require("./world");

const TOTAL_USERS = 30;
const TOTAL_EDGES = 100;

// const app = new PIXI.Application();
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
      data: { id: user.id }
    });
    Object.entries(user.trustedUsers).forEach(([userId, trust]) => {
      graphElements.edges.push({
        data: { id: user.id + userId, source: user.id, target: userId }
      });
    });
  })
  return graphElements;
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
  // const graphLayout = {
  //   name: 'grid',
  //   rows: 10
  // }
  const graphLayout = {
    name: 'concentric',
    concentric: function( node ){
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
    const trustLevels = user.recalculateTrust();
    console.log("Trust levels: ", trustLevels);
    Object.keys(usersMap).forEach((userId) => {
      cy.getElementById(userId).style('background-color', '#aaaaaa');
    });
    Object.entries(trustLevels).forEach(([userId, trustLevel]) => {
      let style = "#";
      if (trustLevel < 0) {
        style += (255).toString(16);
        style += Math.floor(255 - Math.abs(trustLevel) / 100 * 255).toString(16); // G
        style += Math.floor(255 - Math.abs(trustLevel) / 100 * 255).toString(16); // B
      } else {
        style += Math.floor(255 - Math.abs(trustLevel) / 100 * 255).toString(16); // R
        style += (255).toString(16);
        style += Math.floor(255 - Math.abs(trustLevel) / 100 * 255).toString(16); // B
      }
      console.log("Trust level: ", trustLevel, " style: ", style);
      cy.getElementById(userId).style('background-color', style)

    });
  });
}

async function createWorld() {
  const users = await world.generate(TOTAL_USERS, TOTAL_EDGES);
  const rootUser = users[0];
  createGraph(users, rootUser);
}

createWorld();