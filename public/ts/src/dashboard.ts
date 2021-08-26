import { mjElement, mjComponent, m, cc, span } from './mj.js';
import * as util from './util.js';

const title = m('div').text('Dashboard').addClass('display-6 my-5 text-center');

const Alerts = util.CreateAlerts();

const LogoutBtn = cc('button', {classes: 'btn btn-sm btn-outline-secondary'});
const LogoutBtnArea = cc('div', {classes: 'text-center my-5', children: [
  m(LogoutBtn).text('Logout').on('click', event => {
    event.preventDefault();
    util.ajax({method:'GET',url:'/api/logout',alerts:Alerts,buttonID:LogoutBtn.id},
      () => {
        location.href = '/';
      });
  }),
]});

const Index = cc('div', {children: [
  m('div').append([
    create_item('Timeline', '/public/timeline.html', '时间线'),
    create_item('All Islands', '/public/islands.html', '全部小岛'),
    create_item('New Island', '/public/island-info.html', '新建小岛'),
    create_item('Config', '/public/config.html', '全局设置'),
    m(LogoutBtnArea),
    m('div').addClass('small text-secondary text-center my-5').append([
      span('version 2021-08-23'),
      m('br'),
      m('a').text('https://github.com/ahui2016/iPelago-Server').addClass('small text-secondary')
        .attr({href:'https://github.com/ahui2016/iPelago-Server',target:'_blank'}),
      m('i').addClass('small bi bi-box-arrow-up-right ms-1'),
    ]),  
  ]),
]});

$('#root').append([
  title,
  m(Alerts),
  m(Index).addClass('onLoggedIn').hide(),
  m(util.LoginArea).addClass('onLoggedOut my-5'),
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
