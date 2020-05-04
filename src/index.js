const cytoscape = require('cytoscape');
const models = require("./models");
const World = require("./world");

const TOTAL_USERS = 100;
const TOTAL_EDGES = 1000;

// const app = new PIXI.Application();
const world = new World();
const canvas = document.getElementById("cy");
// const renderer = PIXI.autoDetectRenderer({
//   width: 1024, 
//   height: 767, 
//   view: canvas,
//   backgroundColor: 0xFFFFFF,
// });


function createUserGraphics(users) {
  const graphics = new PIXI.Graphics();

  let xPos = 10;
  let yPos = 10;
  Object.entries(users).forEach(([id, user]) => {
    const person = PIXI.Sprite.from("assets/img/person.jpeg");
    person.anchor.set(0.5);
    person.x = xPos;
    person.y = yPos;
    person.interactive = true;
    person.buttonMode = true;
    person.on('pointerdown', () => {
      person.x = app.screen.width / 2;
      person.y = app.screen.width / 2;
    });


    app.stage.addChild(person);
    xPos += 30;
    if (xPos > 1000) {
      xPos = 10;
      yPos += 30;
    }
  });
}



function convertUsersToGraphElements(users) {
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
  const graphElements = convertUsersToGraphElements(users);
  // const graphElements = {
  //   nodes: [
  //     {
  //       data: { id: 'a' }
  //     },

  //     {
  //       data: { id: 'b' }
  //     }
  //   ],
  //   edges: [
  //     {
  //       data: { id: 'ab', source: 'a', target: 'b' }
  //     }
  //   ]
  // };
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


  var cy = cytoscape({
    container: canvas,
    elements: graphElements,
    style: graphStyle,
    layout: graphLayout
  });
}

async function createWorld() {
  const users = await world.generate(TOTAL_USERS, TOTAL_EDGES);
  createGraph(users);
}

createWorld();
// var cy = cytoscape({

//   container: document.getElementById('cy'), // container to render in

//   elements: [ // list of graph elements to start with
//     { // node a
//       data: { id: 'a' }
//     },
//     { // node b
//       data: { id: 'b' }
//     },
//     { // edge ab
//       data: { id: 'ab', source: 'a', target: 'b' }
//     }
//   ],

//   style: [ // the stylesheet for the graph
//     {
//       selector: 'node',
//       style: {
//         'background-color': '#666',
//         'label': 'data(id)'
//       }
//     },

//     {
//       selector: 'edge',
//       style: {
//         'width': 3,
//         'line-color': '#ccc',
//         'target-arrow-color': '#ccc',
//         'target-arrow-shape': 'triangle',
//         'curve-style': 'bezier'
//       }
//     }
//   ],

//   layout: {
//     name: 'grid',
//     rows: 1
//   }

// });
