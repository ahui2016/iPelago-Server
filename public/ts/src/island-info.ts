import { mjElement, mjComponent, m, cc } from './mj.js';
import * as util from './util.js';

let islandID = util.getUrlParam('id');

const Alerts = util.CreateAlerts();
const Loading = util.CreateLoading();

const [infoBtn, infoMsg] = util.CreateInfoPair(
  '使用说明',
  m('div').text('按 F12 打开控制台，输入命令 danger_delete_island() 可删除小岛，不可恢复。')
);

const Title = cc('div', {classes: 'display-6'});
const TitleArea = cc('div', {
  classes: 'd-flex justify-content-between align-items-center my-5',
  children: [
    m(Title).text('建岛'),
    m('div').append([
      infoBtn.addClass('onLoggedIn OldIsland').hide(),
      m('a').attr({href:'/public/dashboard.html',title:'dashboard'}).addClass('btn btn-outline-dark ms-1').append(
        m('i').addClass('bi bi-gear')
      ),
    ]),
  ]
});

const NameInput = cc('input');
const AvatarInput = cc('input');
const EmailInput = cc('input');
const LinkInput = cc('input');
const NoteInput = cc('input');
const RadioPublic = cc('input', {
  classes:'form-check-input',
  attr:{type: 'radio', value: 'public', name: 'island-hide'},
});
const RadioPrivate = cc('input', {
  classes:'form-check-input',
  attr:{type: 'radio', value: 'private', name: 'island-hide'},
});

const Form = cc('div', {classes:'vstack gap-3', children: [
  create_item(NameInput, 'Name', '岛名，相当于用户名或昵称 (必填)'),
  create_item(EmailInput, 'Email', '岛主的真实 email, 可作为后备联系方式。(可留空，但建议填写)'),
  create_item(AvatarInput, 'Avatar', '头像图片的网址，头像图片应为正方形，建议头像体积控制在 100KB 以下。请确保头像图片能跨域访问。(可留空)'),
  create_item(LinkInput, 'Link', '一个网址，可以是你的个人网站或博客，也可填写其他社交帐号的网址。(可留空)'),
  create_item(NoteInput, 'Note', '关于该岛的备注，该内容只在本地使用，不会对外发布。'),
  m('div').addClass('hstack gap-3').append([
    m('div').text('是否公开:'),
    m('div').addClass('form-check form-check-inline').append([
      m(RadioPublic).attr({checked:true}),
      m('label').text('Public').addClass('form-check-label').attr({for:RadioPublic.raw_id}),
    ]),
    m('div').addClass('form-check form-check-inline').append([
      m(RadioPrivate),
      m('label').text('Private').addClass('form-check-label').attr({for:RadioPrivate.raw_id}),
    ]),
  ]),
]});

const CreateBtn = cc('button', {classes:'NewIsland btn btn-primary me-2'});
const UpdateBtn = cc('button', {classes:'OldIsland btn btn-primary me-2'});
const MsgBtn = cc('a', {classes:'OldIsland btn btn-secondary me-2'});
const NewsletterBtn = cc('a', {classes:'btn btn-secondary'});

const SubmitBtnArea = cc('div', {children:[
  m(CreateBtn).text('Create').on('click', async () => {
    try {
      const body = await newIslandForm();
      util.ajax({method:'POST',url:'/admin/create-island',alerts:Alerts,buttonID:CreateBtn.id,body:body},
        (resp) => {
          islandID = resp.message;
          MsgBtn.elem().attr({href:'/public/island-messages.html?id='+islandID});
          Alerts.insert('success', '建岛成功');
          $('.NewIsland').hide();
          $('.OldIsland').show();
          if (body.get('hide') == 'public') {
            NewsletterBtn.elem().show();
          }
        });
    } catch (errMsg) {
      Alerts.insert('danger', errMsg);
    }
  }),

  m(UpdateBtn).text('Update').hide().on('click', async () => {
    try {
      const body = await newIslandForm();
      util.ajax({method:'POST',url:'/admin/update-island',alerts:Alerts,buttonID:UpdateBtn.id,body:body},
        () => {
          if (body.get('hide') == 'public') {
            NewsletterBtn.elem().show();
          } else {
            NewsletterBtn.elem().hide();
          }
          Alerts.insert('success', '更新成功')
        });
    } catch (errMsg) {
      Alerts.insert('danger', errMsg);
    }
  }),

  m(MsgBtn).text('Messages').hide()
    .attr({href:'/public/island-messages.html?id='+islandID}),

  m(NewsletterBtn).text('Publish').hide()
    .attr({href:'/public/publish.html?id='+islandID}),
]});

$('#root').append([
  m(TitleArea),
  infoMsg.hide(),
  m(Loading).hide(),
  m(Form).addClass('onLoggedIn').hide(),
  m(Alerts).addClass('my-3'),
  m(util.LoginArea).addClass('onLoggedOut my-3'),
  m(SubmitBtnArea).addClass('onLoggedIn mb-5 text-end').hide(),
]);

function create_item(comp: mjComponent, name: string, description: string): mjElement {
  return m('div').append([
    m('label').addClass('form-label fw-bold').attr({for:comp.raw_id}).text(name),
    m(comp).addClass('form-control').attr({type:'text'}),
    m('div').addClass('form-text').text(description),
  ]);
}

init();

async function init() {
  const isLoggedIn = await util.checkLogin(Alerts);
  if (!isLoggedIn) return;

  if (!islandID) {
    $('.NewIsland').show();
    $('.OldIsland').hide();
  } else {
    Loading.show();
    const body = util.newFormData('id', islandID);
    util.ajax({method:'POST',url:'/admin/get-island',alerts:Alerts,body:body},
      (resp) => {
        const island = resp as util.Island;
        if (!island.ID) {
          Form.elem().hide();
          SubmitBtnArea.elem().hide();
          Alerts.insert('danger', `找不到小岛(id: ${islandID})`);
          return;
        }
        $('.NewIsland').hide();
        $('.OldIsland').show();
        if (!island.Hide) {
          NewsletterBtn.elem().show();
        }
        Title.elem().text('小岛信息');
        NameInput.elem().val(island.Name);
        EmailInput.elem().val(island.Email);
        AvatarInput.elem().val(island.Avatar);
        LinkInput.elem().val(island.Link);
        NoteInput.elem().val(island.Note);
        if (island.Hide) {
          RadioPrivate.elem().prop('checked', true);
        } else {
          RadioPublic.elem().prop('checked', true);
        }
      }, undefined, () => {
        Loading.hide();
      });
  }
}

async function newIslandForm() {
  try {
    var avatarAddr = util.val(AvatarInput).trim();
    await checkAvatarSize(avatarAddr);    
  } catch (errMsg) {
    if (errMsg.indexOf('error occurred during the transaction') >= 0) {
      errMsg = '无法访问头像图片(请确保可跨域访问): ' + errMsg;
    }
    throw errMsg;
  }
  const body = new FormData();
  body.set('id', islandID);
  body.set('name', util.val(NameInput).trim());
  body.set('email', util.val(EmailInput).trim());
  body.set('avatar', avatarAddr);
  body.set('link', util.val(LinkInput).trim());
  body.set('note', util.val(NoteInput).trim());
  body.set('hide', $('input[name="island-hide"]:checked').val() as string);
  return body;
}

async function checkAvatarSize(avatarAddr: string) {
  const avatar: Blob = await util.ajaxPromise({
    method:'GET',url:avatarAddr,responseType:'blob',alerts:Alerts
  }, 10);
  if (avatar.size > 500 * 1024) { throw '头像图片体积太大' }
}

(window as any).danger_delete_island = () => {
  const body = util.newFormData('id', islandID);
  util.ajax({method:'POST',url:'/admin/delete-island',alerts:Alerts,body:body},
    () => {
      Form.elem().hide();
      SubmitBtnArea.elem().hide();
      const msg = '该岛及其全部消息已被删除。';
      Alerts.clear().insert('success', msg);
      console.log(msg);
    });
}