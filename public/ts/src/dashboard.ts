import { mjElement, mjComponent, m, cc, ct } from './mj.js';
import * as util from './util.js';

const title = m('div').attr({id:'title'}).addClass('display-6 my-5 text-center').append([
  ct('iPelago'), m('sup').text('online'),
]);

const Alerts = util.CreateAlerts();

const Index = cc('div', {children: [
  m('div').append([
    create_item('New Island', '/public/island-info.html', '新建小岛'),
  ]),
]});

$('#root').append([
  title,
  m(Alerts),
  m(Index).addClass('onLoggedIn').hide(),
  m(util.LoginArea).addClass('onLoggedOut'),
]);

function create_item(name: string, link: string, description: string): mjElement {
  return m('div').addClass('row mb-2 g-1').append([
    m('div').addClass('col text-end').append(
      m('a').text(name).attr({href:link}).addClass('text-decoration-none')
    ),
    m('div').addClass('col').text(description),
  ]);
}

init();

async function init() {
  const isLoggedIn = await util.checkLogin(Alerts);
  if (!isLoggedIn) return;
}
