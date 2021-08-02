import { mjElement, mjComponent, m, cc } from './mj.js';
import * as util from './util.js';

const title = m('div').text('iPelago Online').addClass('display-4 my-5 text-center');

const Alerts = util.CreateAlerts();

const PwdInput = cc('input');
const SubmitBtn = cc('button');

const LoginForm = cc('form', undefined, [
  m('label').text('请输入管理员密码:').attr({for:PwdInput.id}).addClass('form-label'),
  m('div').addClass('input-group').append([
    m(PwdInput).attr({type:'password'}).addClass('form-control'),
    m(SubmitBtn).text('login').addClass('btn btn-primary'),
  ]),
]);

$('#root').append([
  title,
  m(LoginForm),
  m(Alerts),
]);

init();

async function init() {
  const isLoggedIn = await util.getLoginStatus();
  if (isLoggedIn) {
    LoginForm.elem().hide();
    Alerts.insert('info', '已登入');
  } else {
    PwdInput.elem().trigger('focus');
  }
}