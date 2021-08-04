import { m, cc } from './mj.js';
import * as util from './util.js';
let islandID = '';
const Title = cc('div', { classes: 'display-6' });
const TitleArea = cc('div', {
    classes: 'd-flex justify-content-between align-items-center my-5',
    children: [
        m(Title).text('建岛'),
        m('a').attr({ href: '/public/dashboard.html', title: 'dashboard' }).addClass('btn btn-outline-dark').append(m('i').addClass('bi bi-gear')),
    ]
});
const NameInput = cc('input');
const AvatarInput = cc('input');
const EmailInput = cc('input');
const LinkInput = cc('input');
const Form = cc('div', { children: [
        create_item(NameInput, 'Name', '岛名，相当于用户名或昵称 (必填)'),
        create_item(EmailInput, 'Email', '岛主的真实 email, 可作为后备联系方式。(可留空，但建议填写)'),
        create_item(AvatarInput, 'Avatar', '头像图片的网址，头像图片应为正方形，建议头像体积控制在 100KB 以下。请确保头像图片能跨域访问。(可留空)'),
        create_item(LinkInput, 'Link', '一个网址，可以是你的个人网站或博客，也可填写其他社交帐号的网址。(可留空)'),
    ] });
const Alerts = util.CreateAlerts();
const Loading = util.CreateLoading();
const CreateBtn = cc('button', { classes: 'NewIsland btn btn-primary me-2' });
const UpdateBtn = cc('button', { classes: 'OldIsland btn btn-primary me-2' });
const MsgBtn = cc('a', { classes: 'OldIsland btn btn-secondary me-2' });
const NewsletterBtn = cc('a', { classes: 'OldIsland btn btn-secondary' });
const SubmitBtnArea = cc('div', { children: [
        m(CreateBtn).text('Create').on('click', async () => {
            try {
                const body = await newIslandForm();
                util.ajax({ method: 'POST', url: '/api/create-island', alerts: Alerts, buttonID: CreateBtn.id, body: body }, (id) => {
                    islandID = id;
                    Alerts.insert('success', '建岛成功');
                    $('.NewIsland').hide();
                    $('.OldIsland').show();
                });
            }
            catch (errMsg) {
                Alerts.insert('danger', errMsg);
            }
        }),
        m(UpdateBtn).text('Update').hide().on('click', async () => {
            try {
                const body = await newIslandForm();
                util.ajax({ method: 'POST', url: '/api/update-island', alerts: Alerts, buttonID: UpdateBtn.id, body: body }, () => { Alerts.insert('success', '更新成功'); });
            }
            catch (errMsg) {
                Alerts.insert('danger', errMsg);
            }
        }),
        m(MsgBtn).text('Messages').hide()
            .attr({ type: 'button', href: '/public/messages?island=' + islandID }),
        m(NewsletterBtn).text('Publish').hide()
            .attr({ type: 'button', href: '/public/newsletter?island=' + islandID }),
    ] });
$('#root').append([
    m(TitleArea),
    m(Loading).hide(),
    m(Form).addClass('onLoggedIn').hide(),
    m(Alerts).addClass('my-3'),
    m(util.LoginArea).addClass('onLoggedOut'),
    m(SubmitBtnArea).addClass('onLoggedIn').hide(),
]);
function create_item(comp, name, description) {
    return m('div').addClass('mb-3').append([
        m('label').addClass('form-label fw-bold').attr({ for: comp.raw_id }).text(name),
        m(comp).addClass('form-control').attr({ type: 'text' }),
        m('div').addClass('form-text').text(description),
    ]);
}
init();
async function init() {
    const isLoggedIn = await util.checkLogin(Alerts);
    if (!isLoggedIn)
        return;
    islandID = util.getUrlParam('id');
    if (islandID) {
        Loading.show();
        const body = util.newFormData('id', islandID);
        util.ajax({ method: 'GET', url: '/api/get-island', alerts: Alerts, body: body }, (resp) => {
            const island = resp;
            $('.NewIsland').hide();
            $('.OldIsland').show();
            Title.elem().text('小岛信息');
            NameInput.elem().val(island.Name);
            EmailInput.elem().val(island.Email);
            AvatarInput.elem().val(island.Avatar);
            LinkInput.elem().val(island.Link);
        }, undefined, () => {
            Loading.hide();
        });
    }
}
async function newIslandForm() {
    try {
        var avatarAddr = util.val(AvatarInput).trim();
        await checkAvatarSize(avatarAddr);
    }
    catch (errMsg) {
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
    return body;
}
async function checkAvatarSize(avatarAddr) {
    const avatar = await util.ajaxPromise({
        method: 'GET', url: avatarAddr, responseType: 'blob', alerts: Alerts
    }, 10);
    if (avatar.size > 500 * 1024) {
        throw '头像图片体积太大';
    }
}
