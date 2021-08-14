import { m, cc, appendToList } from './mj.js';
import * as util from './util.js';
let islandID = util.getUrlParam('id');
let lastTime = dayjs().unix();
const Alerts = util.CreateAlerts();
const Loading = util.CreateLoading();
const InfoCard = cc('div', { classes: 'card', children: [
        m('div').addClass('card-body d-flex justify-content-start align-items-start').append([
            m('img').addClass('Avatar').attr({ src: '/public/avatar-default.jpg', alt: 'avatar' }),
            m('div').addClass('ms-3 flex-fill IslandInfo').append([
                m('div').append([
                    m('span').addClass('Name fw-bold'),
                    m('span').text('private').addClass('IslandPrivate ms-2 badge rounded-pill bg-dark').hide(),
                    m('span').text('public').addClass('IslandPublic ms-2 badge rounded-pill bg-success').on('click', () => {
                        Alerts.insert('primary', `小岛地址: ${location.origin}/public/${islandID}.json`);
                    }),
                ]),
            ]),
        ]),
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
        islandInfo.append(m('a').addClass('small').text(island.Link).attr({ href: island.Link }));
    }
    if (island.Note) {
        islandInfo.append(m('div').addClass('small text-muted').text(island.Note));
    }
};
const MsgList = cc('ul', { classes: 'list-group list-group-flush' });
const MoreBtn = cc('button', { classes: 'btn btn-primary' });
const MoreBtnAlerts = util.CreateAlerts();
const MoreBtnArea = cc('div', { classes: 'text-center my-5', children: [
        m(MoreBtn).text('More').on('click', getMessages),
    ] });
$('#root').append([
    m(InfoCard).addClass('my-5').hide(),
    m(Alerts),
    m(MsgList),
    m(Loading).addClass('my-5').hide(),
    m(MoreBtnAlerts),
    m(MoreBtnArea).hide(),
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
            MoreBtnArea.elem().show();
            getMessages();
        }, undefined, () => {
            Loading.hide();
        });
    }
}
function getMessages() {
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
    });
}
function MsgItem(msg) {
    const datetime = dayjs.unix(msg.Time).format('YYYY-MM-DD HH:mm:ss');
    const MsgAlerts = util.CreateAlerts();
    return cc('div', { id: util.itemID(msg.ID), classes: 'list-group-item MsgItem mb-3', children: [
            m('div').text(datetime).addClass('small text-muted'),
            m('span').text(msg.Body),
            m(MsgAlerts),
        ] });
}
