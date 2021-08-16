import { m, cc, appendToList } from './mj.js';
import * as util from './util.js';
const title = m('div').text('Islands').addClass('display-4 my-5 text-center');
const Alerts = util.CreateAlerts();
const Loading = util.CreateLoading();
const IslandList = cc('div', { classes: 'vstack gap-3' });
$('#root').append([
    title,
    m(Loading).hide(),
    m(Alerts),
    m(IslandList).addClass('my-5'),
    m(util.LoginArea).addClass('onLoggedOut'),
]);
init();
async function init() {
    const isLoggedIn = await util.checkLogin(Alerts);
    if (!isLoggedIn)
        return;
    Loading.show();
    util.ajax({ method: 'GET', url: '/admin/all-islands', alerts: Alerts }, (resp) => {
        const islands = resp;
        if (!islands || islands.length == 0) {
            Alerts.insert('info', '尚未订阅任何岛');
            return;
        }
        appendToList(IslandList, islands.map(IslandItem));
    }, undefined, () => {
        Loading.hide();
    });
}
function IslandItem(island) {
    let avatar = '/public/avatar-default.jpg';
    if (island.Avatar) {
        avatar = island.Avatar;
    }
    const islandPage = '/public/island-info.html?id=' + island.ID;
    const datetime = dayjs.unix(island.Message.time).format('YYYY-MM-DD HH:mm:ss');
    const ItemAlerts = util.CreateAlerts();
    const self = cc('div', { id: util.itemID(island.ID), classes: 'card', children: [
            m('div').addClass('card-body').append([
                m('ul').addClass('list-group list-group-flush').append([
                    m('li').addClass('list-group-item d-flex justify-content-start align-items-start').append([
                        m('a').addClass('AvatarLink').attr({ href: islandPage }).append(m('img').addClass('Avatar').attr({ src: avatar, alt: 'avatar' })),
                        m('div').addClass('ms-3').append([
                            m('p').addClass('CardTitle').append(m('a').text(island.Name).attr({ href: islandPage })
                                .addClass('text-decoration-none text-dark fw-bold')),
                        ]),
                    ]),
                    m('li').addClass('list-group-item').append([
                        m('div').addClass('small').append([
                            m('span').addClass('text-muted').text(datetime),
                            m('span').text('private').attr({ title: '本岛不对外公开' }).addClass('IslandPrivate ms-2 badge rounded-pill bg-dark').hide(),
                            m('span').text('public').attr({ title: '点击查看小岛地址' }).addClass('IslandPublic ms-2 badge rounded-pill bg-success').on('click', () => {
                                ItemAlerts.insert('primary', `小岛地址: ${location.origin}/public/${island.ID}.json`);
                            }),
                        ]),
                        m('span').addClass('small').text(island.Message.body),
                    ]),
                ]),
                m(ItemAlerts),
            ]),
        ] });
    self.init = () => {
        const cardTitle = $(self.id).find('.CardTitle');
        const islandPublic = $(self.id).find('.IslandPublic');
        const islandPrivate = $(self.id).find('.IslandPrivate');
        if (island.Email) {
            cardTitle.append([
                m('span').addClass('small text-muted text-break').text(` (${island.Email})`),
            ]);
        }
        if (island.Link) {
            cardTitle.append([
                m('br'),
                m('a').addClass('small').text(island.Link).attr({ href: island.Link }),
            ]);
        }
        if (island.Note) {
            cardTitle.append([
                m('br'),
                m('span').addClass('small text-muted text-break').text(island.Note),
            ]);
        }
        if (island.Hide) {
            islandPublic.hide();
            islandPrivate.show();
        }
    };
    return self;
}
