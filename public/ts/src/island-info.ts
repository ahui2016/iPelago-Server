import { mjElement, mjComponent, m, cc } from './mj.js';
import * as util from './util.js';

const Title = cc('div', {classes: 'display-6'});
const TitleArea = cc('div', {
  classes: 'd-flex justify-content-between align-items-center my-5',
  children: [
    m(Title).text('建岛'),
    m('a').attr({href:'/public/dashboard',title:'dashboard'}).addClass('btn btn-outline-dark').append(
      m('i').addClass('bi bi-gear')
    ),
  ]
});

$('#root').append([
  m(TitleArea),
]);
