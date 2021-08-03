import { mjElement, mjComponent, m, cc } from './mj.js';
import * as util from './util.js';

const title = m('div').addClass('display-4 my-5 text-center').text('Timeline');

const Login = cc('div', {children: [
  m('a').text('login').attr({href:'/public/login.html'}),
]});

const Logout = cc('div', {children: [
  m('a').text('logout'),
]});

$('#root').append([
  title,
  m(Login),
  m(Logout),
]);

init();

function init() {
  util.ajax({method:'GET',url:'/api/login-status'},
      (isLoggedIn) => {
        if (isLoggedIn) {
          Login.elem().hide();
        } else {
          Logout.elem().hide();
        }
      });
}
