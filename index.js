import List from 'list.js';

const list = new List('reactions', {
  valueNames: [ 'total', 'recent', 'title' ]
});
list.sort('total', { order: 'desc' });
