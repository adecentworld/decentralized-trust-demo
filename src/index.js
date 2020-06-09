const cytoscape = require('cytoscape');
const models = require("./models");
const World = require("./world");

const {enableRipple} = require("@syncfusion/ej2-base");
enableRipple(true);
const {Slider} = require("@syncfusion/ej2-inputs");


const DEFAULT_TOTAL_USERS = 20;
const DEFAULT_RATINGS_PER_USER = 4;
const DEFAULT_TRUST_DEPTH = 3;

let totalUsers = DEFAULT_TOTAL_USERS;
let totalRatings = DEFAULT_RATINGS_PER_USER * totalUsers;
let trustDepth = DEFAULT_TRUST_DEPTH;

let globalUsers = null;
let usersMap = null;
let selectedUser = null;
let cy = null;

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
  usersMap = createUsersHashMap(users);
  const graphElements = convertUsersToGraphElements(users);
  const graphStyle = [
    {
      selector: 'node',
      style: {
        'background-color': '#666',
        'label': 'data(id)',
        'font-size': '16px',
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#999',
        'target-arrow-color': '#999',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier'
      }
    }
  ];
  const graphLayout = {
    name: 'random',
  };

  cy = cytoscape({
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
    selectedUser = user;
    renderGraph(user);
  });
}


function resetGraph() {
  Object.keys(usersMap).forEach((userId) => {
    cy.getElementById(userId).data('trustDegree', 0);
    cy.getElementById(userId).style('background-color', '#aaaaaa');
  });

  cy.edges().style({visibility: 'hidden'});
}

function renderTrustedUsers(user, depth) {
  const trustRatings = user.getTrustRatings();
  Object.entries(trustRatings).forEach(([friendId, trustRating]) => {
    if (cy.getElementById(friendId).data('trustDegree') < depth) {
      cy.getElementById(friendId).data('trustDegree', depth);
    }
    const edgeId = user.id + friendId;

    const color = getHexColorForTrustLevel(trustRating);
    cy.getElementById(edgeId).style({
      visibility: 'visible',
      lineColor: color,
      targetArrowColor: color,
    });

    if (trustRating < 0) return; // Don't show lines to friends of untrusted people
    if (depth <= 1) return; // We've gone as deep as we need to go, so return

    const friend = usersMap[friendId];
    renderTrustedUsers(friend, depth-1);
  });
}

function renderGraph(user) {
  const userId = user.id;
  user.calculateTrust(trustDepth);

  resetGraph();

  // Set main user to center, TRUST_DEPTH + 1 because the outer layer is reserved for unknown strangers
  cy.getElementById(userId)
    .data('trustDegree', trustDepth + 1)
    .style('background-color', '#4444ff');

  renderTrustedUsers(user, trustDepth);

  // Set colors based on Trust Levels
  const trustLevels = user.getTrustLevels();
  Object.entries(trustLevels).forEach(([userId, trustLevel]) => {
    const backgroundColor = getHexColorForTrustLevel(trustLevel);
    cy.getElementById(userId).style('background-color', backgroundColor)
  });

  const layout = cy.elements().layout({
    name: 'concentric',
    concentric: function(node) {
      return node.data('trustDegree');
    },
    levelWidth: function(nodes) {
      return 1;
    },
    animate: true,
    nodeDimensionsIncludeLabels: true,
    spacingFactor: 0.8
  });
  layout.run();
}

function debounce(callback, time) {
  let interval;
  return (...args) => {
    clearTimeout(interval);
    interval = setTimeout(() => {
      interval = null;
      callback(...args);
    }, time);
  };
};

async function createWorld(totalUsers, totalRatings, trustDepth) {
  globalUsers = await world.generate(totalUsers, totalRatings);
  createGraph(globalUsers, trustDepth);
}

createWorld(totalUsers, totalRatings, trustDepth);
const updateWorld = debounce(createWorld, 250);

const usersSlider = new Slider({
  min: 5,
  max: 50,
  value: DEFAULT_TOTAL_USERS,
  ticks: {
    placement: 'Before',
    largeStep: 5,
    smallStep: 1
  },
  change: function(settings) {
    totalUsers = settings.value;
    updateWorld(totalUsers, totalRatings, trustDepth);
  }
});
usersSlider.appendTo('#users-slider');

const ratingsSlider = new Slider({
  min: 1,
  max: 10,
  value: DEFAULT_RATINGS_PER_USER,
  ticks: {
    placement: 'Before',
    largeStep: 1,
    smallStep: 1
  },
  change: function(settings) {
    totalRatings = settings.value * totalUsers;
    updateWorld(totalUsers, totalRatings, trustDepth);
  }
});
ratingsSlider.appendTo('#edges-slider');

const trustDepthSlider = new Slider({
  min: 1,
  max: 6,
  value: DEFAULT_TRUST_DEPTH,
  ticks: {
    placement: 'Before',
    largeStep: 1,
    smallStep: 1
  },
  change: function(settings) {
    trustDepth = settings.value;
    renderGraph(selectedUser);
  }
});
trustDepthSlider.appendTo('#trust-depth-slider');