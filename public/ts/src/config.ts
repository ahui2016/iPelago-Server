import { mjElement, mjComponent, m, cc, span } from './mj.js';
import * as util from './util.js';

interface Titles {
  Title: string;
  Subtitle: string;
}

const Loading = util.CreateLoading();
const Alerts = util.CreateAlerts();

const titleArea = m('div').addClass('my-5 text-center').append([
  m('div').addClass('display-4').append([
    span('Config'),
    m('a').attr({href:'/public/dashboard.html',title:'dashboard'}).addClass('btn btn-sm btn-outline-dark ms-1').append(
      m('i').addClass('bi bi-gear')
    ),  
  ]),
]);

const TitlesAlerts = util.CreateAlerts();
const TitleInput = cc('input');
const SubtitleInput = cc('input');
const UpdateTitlesBtn = cc('button', {classes:'btn btn-primary me-2'});
const ConfigTitles = cc('div', {children:[
  m('div').addClass('vstack gap-3').append([
    create_item(TitleInput, 'Title', '首页的大标题'),
    create_item(SubtitleInput, 'Subtitle', '首页的副标题'),
  ]),
  m(TitlesAlerts).addClass('my-2'),
  m('div').addClass('text-center mt-4 mb-5').append([
    m(UpdateTitlesBtn).text('Update Titles').on('click', () => {
      const body = {
        title: util.val(TitleInput).trim(),
        subtitle: util.val(SubtitleInput).trim()
      };
      util.ajax({method:'POST',url:'/admin/update-titles',alerts:TitlesAlerts,buttonID:UpdateTitlesBtn.id,body:body},
        () => {
          TitlesAlerts.clear().insert('success', '标题更新成功');
        });    
    }),
  ]),
]});

const PasswordAlerts = util.CreateAlerts();
const OldPassword = cc('input');
const NewPassword = cc('input');
const ChangePwdBtn = cc('button', {classes:'btn btn-primary me-2'});
const ConfigPassword = cc('div', {children:[
  m('div').addClass('vstack gap-3').append([
    create_item(OldPassword, 'Old Password', '请输入正确的旧密码(原密码)'),
    create_item(NewPassword, 'New Password', '请输入新密码 (注意：请记住新密码，没有找回密码功能)'),
  ]),
  m(PasswordAlerts).addClass('my-2'),
  m('div').addClass('text-center mt-4 mb-5').append([
    m(ChangePwdBtn).text('Change Password').on('click', () => {
      const body = {
        'old-pwd': util.val(OldPassword),
        'new-pwd': util.val(NewPassword)
      };
      if (!body['old-pwd']) {
        PasswordAlerts.insert('danger', '请输入旧密码');
        OldPassword.elem().trigger('focus');
        return;
      }
      if (!body['new-pwd']) {
        PasswordAlerts.insert('danger', '请输入新密码');
        NewPassword.elem().trigger('focus');
        return;
      }
      util.ajax({method:'POST',url:'/admin/change-password',alerts:PasswordAlerts,buttonID:ChangePwdBtn.id,body:body},
        () => {
          PasswordAlerts.clear().insert('success', '更改密码成功');
          PasswordAlerts.insert('success', '请记住新密码，登入时如果密码错误三次即禁止继续尝试，需要重启服务端才能把密码错误次数重置为零。');
        });
    }),
  ]),
]});

$('#root').append([
  titleArea,
  m(Loading).addClass('my-5'),
  m(Alerts),
  m(ConfigTitles).addClass('onLoggedIn').hide(),
  m(ConfigPassword).addClass('onLoggedIn').hide(),
  m(util.LoginArea).addClass('onLoggedOut my-5').hide(),
]);

init()

async function init() {
  const isLoggedIn = await util.checkLogin(Alerts);
  Loading.hide();
  if (!isLoggedIn) return;

  Loading.show();
  initTitle();
}

function initTitle(): void {
  util.ajax({method:'GET',url:'/api/get-titles',alerts:Alerts},
    (resp) => {
      const titles = resp as Titles;
      TitleInput.elem().val(titles.Title);
      SubtitleInput.elem().val(titles.Subtitle);
    }, undefined, () => {
      Loading.hide();
    });
}

function create_item(comp: mjComponent, label: string, description: string): mjElement {
  return m('div').append([
    m('label').addClass('form-label fw-bold').attr({for:comp.raw_id}).text(label),
    m(comp).addClass('form-control').attr({type:'text'}),
    m('div').addClass('form-text').text(description),
  ]);
}