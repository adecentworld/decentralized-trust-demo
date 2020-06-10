
function pad(num, size){ return ('000000000' + num).substr(-size); }

function debounce(callback, time) {
  let interval;
  return (...args) => {
    clearTimeout(interval);
    interval = setTimeout(() => {
      interval = null;
      callback(...args);
    }, time);
  };
}

module.exports = {pad, debounce};