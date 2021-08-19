import { m, cc, span, appendToList } from './mj.js';
import * as util from './util.js';
const islandID = util.getUrlParam('id');
const islandInfoPage = '/public/island-info.html?id=' + islandID;
let lastTime = dayjs().unix();
const Alerts = util.CreateAlerts();
const Loading = util.CreateLoading();
const TitleArea = cc('div', {
    classes: 'd-flex justify-content-between align-items-center my-3',
    children: [
        m('a').attr({ href: '/', title: 'home' }).addClass('onLoggedOut btn btn-outline-dark').append(m('i').addClass('bi bi-house-door')),
        m('a').attr({ href: islandInfoPage, title: '编辑小岛资料' }).addClass('onLoggedIn btn btn-outline-dark').append(m('i').addClass('bi bi-pencil')).hide(),
        m('a').attr({ href: '/public/dashboard.html', title: 'dashboard' }).addClass('onLoggedIn btn btn-outline-dark').append(m('i').addClass('bi bi-gear')).hide(),
    ]
});
const InfoAlerts = util.CreateAlerts();
const InfoCard = cc('div', { classes: 'card', children: [
        m('div').addClass('card-body d-flex justify-content-start align-items-start').append([
            m('img').addClass('Avatar').attr({ src: '/public/avatar-default.jpg', alt: 'avatar' }),
            m('div').addClass('ms-3 flex-fill IslandInfo').append([
                m('div').append([
                    m('span').addClass('Name fw-bold'),
                    m('span').text('private').attr({ title: '本岛不对外公开' }).addClass('IslandPrivate ms-2 badge rounded-pill bg-dark').hide(),
                    m('span').text('public').attr({ title: '点击查看小岛地址' }).addClass('CursorPointer IslandPublic ms-2 badge rounded-pill bg-success').on('click', () => {
                        InfoAlerts.insert('primary', `小岛地址: ${location.origin}/public/${islandID}.json`);
                    }),
                ]),
            ]),
        ]),
        m(InfoAlerts),
    ] });
InfoCard.init = (arg) => {
    const island = arg;
    if (island.Avatar) {
        InfoCard.elem().find('.Avatar').attr({ src: island.Avatar });
    }
    InfoCard.elem().find('.Name').text(island.Name);
    if (island.Hide) {
        InfoCard.elem().find('.IslandPublic').hide();
        InfoCard.elem().find('.IslandPrivate').show();
    }
    const islandInfo = InfoCard.elem().find('.IslandInfo');
    if (island.Email) {
        islandInfo.append(m('div').addClass('small text-muted').text(island.Email));
    }
    if (island.Link) {
        islandInfo.append(m('div').append(m('a').addClass('small').text(island.Link).attr({ href: island.Link })));
    }
    if (island.Note) {
        islandInfo.append(m('div').addClass('small text-muted').text(island.Note));
    }
};
const MsgInput = cc('textarea', { attr: { placeholder: 'write a new message' }, classes: 'form-control' });
const PostBtn = cc('button', { classes: 'btn btn-outline-primary' });
const MsgPostArea = cc('div', { children: [
        m(MsgInput),
        m('div').addClass('text-end mt-2').append(m(PostBtn).text('Post').on('click', () => {
            const msgBody = util.val(MsgInput).trim();
            if (!msgBody) {
                MsgInput.elem().trigger('focus');
                return;
            }
            const bodySize = new Blob([msgBody]).size;
            if (bodySize > 1024) {
                Alerts.insert('danger', `消息体积(${bodySize} bytes) 超过上限 1024 bytes`);
                MsgInput.elem().trigger('focus');
                return;
            }
            const body = util.newFormData('msg-body', msgBody);
            body.set('island-id', islandID);
            util.ajax({ method: 'POST', url: '/admin/post-message', alerts: Alerts, buttonID: PostBtn.id, body: body }, (resp) => {
                var _a;
                const msg = resp;
                const item = MsgItem(msg);
                MsgList.elem().prepend(m(item));
                (_a = item.init) === null || _a === void 0 ? void 0 : _a.call(item);
                MsgInput.elem().val('').trigger('focus');
            });
        })),
    ] });
const MsgList = cc('div', { classes: 'vstack gap-4' });
const MoreBtn = cc('button', { classes: 'btn btn-outline-secondary' });
const MoreBtnAlerts = util.CreateAlerts();
const MoreBtnArea = cc('div', { classes: 'text-center my-5', children: [
        m(MoreBtn).text('More').on('click', getMessages),
    ] });
$('#root').append([
    m(TitleArea),
    m(InfoCard).hide(),
    m(MsgPostArea).addClass('mt-3').hide(),
    m(Alerts),
    m(MsgList),
    m(MoreBtnAlerts).addClass('my-2'),
    m(Loading).addClass('my-5').hide(),
    m(MoreBtnArea).hide(),
    m(util.LoginArea).addClass('onLoggedOut my-3'),
]);
init();
async function init() {
    const isLoggedIn = await util.checkLogin(Alerts);
    if (!isLoggedIn)
        return;
    if (islandID) {
        Loading.show();
        const body = util.newFormData('id', islandID);
        util.ajax({ method: 'POST', url: '/admin/get-island', alerts: Alerts, body: body }, (resp) => {
            const island = resp;
            InfoCard.elem().show();
            InfoCard.init(island);
            MsgPostArea.elem().show();
            MoreBtnArea.elem().show();
            getMessages();
            MsgInput.elem().trigger('focus');
        });
    }
}
function getMessages() {
    Loading.show();
    const body = util.newFormData('id', islandID);
    body.set('time', lastTime.toString());
    util.ajax({ method: 'POST', url: '/admin/more-island-messages', alerts: Alerts, body: body }, (resp) => {
        const messages = resp;
        if (!messages || messages.length == 0) {
            MoreBtnAlerts.insert('primary', '没有更多消息了');
            MoreBtnArea.elem().hide();
            return;
        }
        if (messages.length < util.everyPage) {
            MoreBtnArea.elem().hide();
        }
        appendToList(MsgList, messages.map(MsgItem));
        lastTime = messages[messages.length - 1].Time;
    }, undefined, () => {
        Loading.hide();
    });
}
function MsgItem(msg) {
    const MsgAlerts = util.CreateAlerts();
    const datetime = dayjs.unix(msg.Time).format('YYYY-MM-DD HH:mm:ss');
    const self = cc('div', { id: util.itemID(msg.ID), children: [
            m('div').addClass('small text-muted').append([
                span(datetime),
                span('DELETED').addClass('Deleted badge bg-secondary ms-1').hide(),
                m('i').addClass('CursorPointer DeleteBtn bi bi-trash ms-1').attr({ title: 'delete' }),
            ]),
            m('span').addClass('Contents fs-5').text(msg.Body),
            m(MsgAlerts),
        ] });
    self.init = () => {
        const selfElem = self.elem();
        selfElem.find('.DeleteBtn').on('click', () => {
            const body = util.newFormData('message-id', msg.ID);
            body.set('island-id', msg.IslandID);
            util.ajax({ method: 'POST', url: '/admin/delete-message', alerts: MsgAlerts, buttonID: `${self.id} .DeleteBtn`, body: body }, () => {
                selfElem.find('.Contents').removeClass('fs-5').addClass('text-muted');
                selfElem.find('.Deleted').toggle();
                selfElem.find('.DeleteBtn').toggle();
            });
        });
    };
    return self;
}
window.danger_delete_island = () => {
    const body = util.newFormData('id', islandID);
    util.ajax({ method: 'POST', url: '/admin/delete-island', alerts: Alerts, body: body }, () => {
        TitleArea.elem().hide();
        InfoCard.elem().hide();
        MsgPostArea.elem().hide();
        MsgList.elem().hide();
        MoreBtnArea.elem().hide();
        const msg = '该岛及其全部消息已被删除。';
        Alerts.clear().insert('success', msg);
        console.log(msg);
    });
};
