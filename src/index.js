const cytoscape = require("cytoscape");
const euler = require("cytoscape-euler");
const World = require("./world");
const {pad, debounce} = require("./helpers");

const {enableRipple} = require("@syncfusion/ej2-base");
enableRipple(true);
const {Slider} = require("@syncfusion/ej2-inputs");

cytoscape.use(euler);

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
let removedEdges = null;

const world = new World();
const canvas = document.getElementById("trust-demo");

function createUsersHashMap(users) {
  const usersMap = {};
  users.forEach((user) => {
    usersMap[user.id] = user;
  });
  return usersMap;
}

function convertUsersToGraphElements(users) {
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
    Object.keys(user.trustedUsers).forEach((userId) => {
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
        'color': '#fff',
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
    cy.getElementById(userId).style('background-color', '#444');
  });

  if (removedEdges != null) {
    removedEdges.restore();
  }
  cy.edges().style({visibility: 'hidden'});
}

/** 
 * This makes all the relevant trust arrows visible and sets their colors.
 * 
 * Starting at the specified user loop through all the users they trust and
 * draw an arrow of a color relative to their trust level. Then call this
 * function on each of them. 
 */
function renderTrustedUsers(user, depth) {
  const trustRatings = user.getTrustRatings();
  Object.entries(trustRatings).forEach(([friendId, trustRating]) => {
    if (cy.getElementById(friendId).data('trustDegree') < depth) {
      cy.getElementById(friendId).data('trustDegree', depth);
    }
    
    // Don't show links back to the selected user
    if (friendId != selectedUser.id) {
      const edgeId = user.id + friendId;
      const color = getHexColorForTrustLevel(trustRating);
      cy.getElementById(edgeId).style({
        visibility: 'visible',
        lineColor: color,
        targetArrowColor: color,
      });
    }

    if (trustRating < 0) return; // Don't show lines to friends of untrusted people
    if (depth <= 1) return; // We've gone as deep as we need to go, so return

    const friend = usersMap[friendId];
    renderTrustedUsers(friend, depth-1);
  });
}

/** 
 * Collect all edges that are still hidden (because they aren't relevant to 
 * the graph for the selected user) and remove them from the graph so they aren't
 * used for positional calculations
 */
function removeHiddenEdges() {
  removedEdges = cy.edges(':hidden').remove()
  console.log("Removed edges: ", removedEdges);
}


/**
 * Core graph rendering function. Resets it to defaults, then colors and changes
 * the graph layout for the selected user. 
 * 
 * @param {User} user 
 */
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

  removeHiddenEdges();
  console.log("Elements length: ", cy.elements().length);

  const layout = cy.elements().layout({
    name: 'euler',
    springLength: 200,
    springCoeff: 0.00005,
    mass: 6,
    gravity: -4,
    pull: 0.002,
    dragCoeff: 0.001,
    timeStep: 30,
    refresh: 20,
    movementThreshold: 5,
    animate: 'end',
    animationDuration: 500,
  });
  layout.run();
}

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
    if (selectedUser != null) {
      renderGraph(selectedUser);
    }
  }
});
trustDepthSlider.appendTo('#trust-depth-slider');