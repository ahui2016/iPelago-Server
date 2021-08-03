import { m, cc, ct } from './mj.js';
import * as util from './util.js';
const title = m('div').attr({ id: 'title' }).addClass('display-6 my-5 text-center').append([
    ct('iPelago'), m('sup').text('online'),
]);
const Alerts = util.CreateAlerts();
const Index = cc('div', { children: [
        m('div').append([
            create_item('New Island', '/public/island-info.html', '新建小岛'),
        ]),
    ] });
const LoginArea = cc('div', {
    classes: 'text-center my-3',
    children: [
        m('a').text('Login').attr({ href: '/public/login.html' }),
    ]
});
$('#root').append([
    title,
    m(Alerts),
    m(Index).hide(),
    m(LoginArea),
]);
function create_item(name, link, description) {
    return m('div').addClass('row mb-2 g-1').append([
        m('div').addClass('col text-end').append(m('a').text(name).attr({ href: link }).addClass('text-decoration-none')),
        m('div').addClass('col').text(description),
    ]);
}
init();
async function init() {
    const isLoggedIn = await util.getLoginStatus();
    if (isLoggedIn) {
        Index.elem().show();
        LoginArea.elem().hide();
    }
    else {
        Alerts.insert('info', '需要用管理员密码登入后才能访问本页面');
        LoginArea.elem().show();
    }
}
