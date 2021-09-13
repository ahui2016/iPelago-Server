import { m, cc } from './mj.js';
import * as util from './util.js';

let lastPage = util.getUrlParam('lastpage');

const title = m('div').text('iPelago Online').addClass('display-4 my-5 text-center');

const Alerts = util.CreateAlerts();

const DashBtn = cc('a', {classes: 'btn btn-primary me-3'});
const LogoutBtn = cc('button', {classes: 'btn btn-outline-primary'});
const LogoutBtnArea = cc('div', {children: [
  m(DashBtn).text('Dashboard').attr({href:'/public/dashboard.html'}),
  m(LogoutBtn).text('Logout').on('click', event => {
    event.preventDefault();
    util.ajax({method:'GET',url:'/api/logout',alerts:Alerts,buttonID:LogoutBtn.id},
      () => {
        $('.onLoggedIn').hide();
        $('.onLoggedOut').show();    
        Alerts.clear().insert('success', '已登出');
        PwdInput.elem().trigger('focus');
      });
  }),
]});

const PwdInput = cc('input');
const SubmitBtn = cc('button');

const LoginForm = cc('form', {children: [
  m('label').text('请输入管理员密码:').attr({for:PwdInput.id}).addClass('form-label'),
  m('div').addClass('input-group').append([
    m(PwdInput).attr({type:'password'}).addClass('form-control'),
    m(SubmitBtn).text('login').addClass('btn btn-primary').on('click', event => {
      event.preventDefault();
      const pwd = PwdInput.elem().val() as string;
      if (!pwd) {
        Alerts.insert('info', '请输入密码');
        PwdInput.elem().trigger('focus');
        return;
      }
      const body = util.newFormData('password', pwd);
      util.ajax({method:'POST',url:'/api/login',alerts:Alerts,buttonID:SubmitBtn.id,body:body},
        () => {
          $('.onLoggedIn').show();
          $('.onLoggedOut').hide();
          Alerts.clear().insert('success', '成功登入');
          if (lastPage) {
            setTimeout(() => { location.href = '/public/'+lastPage }, 1000);            
          }
        }, undefined, () => {
          PwdInput.elem().val('').trigger('focus');
        });
    }),
  ]),
]});

$('#root').append([
  title,
  m(LoginForm).addClass('onLoggedOut mb-2'),
  m(Alerts),
  m(LogoutBtnArea).addClass('onLoggedIn text-center my-3').hide(),
]);

init();

async function init() {
  const isLoggedIn = await util.checkLogin();
  if (isLoggedIn) {
    Alerts.insert('info', '已登入');
  } else {
    PwdInput.elem().trigger('focus');
  }
}
