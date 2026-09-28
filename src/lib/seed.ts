import { db } from './db'

const COVER = (seed: string) => `https://picsum.photos/seed/${seed}/800/450`
const CONTENT = (title: string, paras: string[]) =>
  `# ${title}\n\n${paras.join('\n\n')}`

async function seed() {
  console.log('Seeding database...')

  // SiteConfig
  await db.siteConfig.upsert({
    where: { id: 'default' },
    create: { id: 'default', accessToken: '1234' },
    update: { accessToken: '1234' },
  })

  // AboutConfig
  await db.aboutConfig.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      className: '九四班',
      slogan: '志存高远 · 脚踏实地 · 团结奋进',
      intro:
        '九四班是一个由 48 名同学组成的温暖集体。我们热爱学习、热爱生活，在班主任的带领下共同成长。这里是我们的精神家园，记录着我们青春里的每一个重要时刻。\n\n我们相信：团结就是力量，坚持就有奇迹。在九四班，每个人都是发光体。',
      headTeacher: 'CarreyHui 老师',
      headTeacherQuote:
        '愿你们眼里有光、心中有梦、脚下有路，做最好的自己。',
      classCommittee:
        '班长:李明\n副班长:王芳\n学习委员:张华\n文体委员:刘洋\n生活委员:陈静\n纪律委员:赵强',
      contact:
        '班主任邮箱:carreyhui@94class.edu\n班级公众号:九四班那些事\n紧急联系:班级群',
    },
    update: {},
  })

  // 清空旧事件
  await db.event.deleteMany({})
  await db.confession.deleteMany({})
  await db.message.deleteMany({})

  // 事件
  const events = [
    {
      title: '2026 春季运动会：九四班勇夺团体总分第一',
      summary: '在刚刚落幕的校春季运动会上，九四班凭借出色的团队协作，斩获男子 4×100 接力金牌、女子跳高金牌等多项荣誉，团体总分位列全校第一！',
      content: CONTENT('2026 春季运动会：九四班勇夺团体总分第一', [
        '三天的激烈角逐落下帷幕，九四班以 **总分 138 分** 的成绩荣获团体总分第一名，这是继 2024 年之后我们再次登顶。',
        '## 亮点回顾',
        '- 男子 4×100 接力：李明 / 张华 / 王强 / 刘洋，**48.7 秒** 打破校纪录',
        '- 女子跳高：陈静 1.55m 夺冠',
        '- 男子 1500m：赵强 4:32.1 拼下银牌',
        '- 啦啦队获评"最佳风采奖"',
        '> 团结就是力量，坚持就是奇迹。感谢每一位为班级争光的同学们，感谢所有后勤保障的同学！',
        '![运动会合影](https://picsum.photos/seed/sports94/1200/600)',
        '下一站：市级运动会，我们继续加油！',
      ]),
      coverImage: COVER('sports94'),
      category: '班级活动',
      priority: 'high',
      pinned: 1,
      tags: '运动会,体育,夺冠,团体第一',
    },
    {
      title: '期中考试复习动员：本周六自习安排',
      summary: '距离期中考试还有 12 天，周六组织集体自习，请同学们 8:30 前到教室，带好课本和错题本。',
      content: CONTENT('期中考试复习动员：本周六自习安排', [
        '各位同学：',
        '期中考试临近，为帮助大家系统复习，班委决定本周六组织一次集中自习。',
        '## 时间地点',
        '- **时间**：本周六 8:30 - 16:30',
        '- **地点**：教学楼三楼 94 班教室',
        '## 注意事项',
        '1. 自带课本、错题本、笔',
        '2. 中午统一订餐，AA',
        '3. 不允许迟到，缺席需请假',
        '4. 学习委员张华负责答疑',
        '祝大家复习顺利，期中考出好成绩！',
      ]),
      coverImage: COVER('study94'),
      category: '学习通知',
      priority: 'high',
      pinned: 1,
      tags: '期中,复习,自习',
    },
    {
      title: '校园文化艺术节报名启动',
      summary: '一年一度的校园文化艺术节即将开幕，节目征集通道开启，欢迎同学们踊跃报名（合唱、独唱、舞蹈、戏剧、器乐）。',
      content: CONTENT('校园文化艺术节报名启动', [
        '艺术节将于下月 15 日正式开幕，现面向全班征集节目。',
        '## 可报名类型',
        '- 合唱（5 人以上）',
        '- 独唱 / 独奏',
        '- 舞蹈',
        '- 短剧 / 朗诵',
        '报名截止日期：**本月 28 日**',
        '请将节目名称、参与人数、所需时长发送给文体委员刘洋。',
      ]),
      coverImage: COVER('art94'),
      category: '校园新闻',
      priority: 'normal',
      pinned: 0,
      tags: '艺术节,报名,文艺',
    },
    {
      title: '九四班 2026 新学期开学第一课',
      summary: '新学期，新气象。班主任寄语全体同学：把握当下，不负韶华。',
      content: CONTENT('九四班 2026 新学期开学第一课', [
        '亲爱的同学们：',
        '欢迎回到九四班！新的学期，新的开始。',
        '> "把每一件简单的事做好就是不简单，把每一件平凡的事做好就是不平凡。"',
        '## 本学期目标',
        '- 学业：班级平均分提升 5 分',
        '- 纪律：零迟到、零违纪',
        '- 文体：至少两项校级以上荣誉',
        '让我们携手同行，做最好的自己！',
      ]),
      coverImage: COVER('newterm94'),
      category: '重要公告',
      priority: 'high',
      pinned: 0,
      tags: '开学,新学期,寄语',
    },
    {
      title: '数学竞赛预选赛通知',
      summary: '校数学竞赛预选赛定于下周三下午第七节课举行，有意向参赛的同学请到学习委员处报名。',
      content: CONTENT('数学竞赛预选赛通知', [
        '## 赛事信息',
        '- **时间**：下周三 15:30',
        '- **地点**：阶梯教室',
        '- **范围**：高一代数 + 几何',
        '## 报名方式',
        '请到学习委员张华处登记，截止本周五。',
      ]),
      coverImage: COVER('math94'),
      category: '学习通知',
      priority: 'normal',
      pinned: 0,
      tags: '竞赛,数学,报名',
    },
    {
      title: '班级春游活动：探访植物园',
      summary: '四月芳菲，正是出游好时节。本周末组织班级春游，地点：市植物园，费用 AA，每人 30 元。',
      content: CONTENT('班级春游活动：探访植物园', [
        '春天来啦！让我们一起去拥抱大自然。',
        '## 行程安排',
        '- 8:00 校门口集合',
        '- 9:00 抵达植物园',
        '- 9:30 - 12:00 分组探索',
        '- 12:00 野餐',
        '- 14:00 返程',
        '## 必备物品',
        '- 防晒霜、遮阳帽',
        '- 水壶、零食',
        '- 笔记本（自然观察任务）',
        '请所有同学参加，特殊情况需请假。',
      ]),
      coverImage: COVER('spring94'),
      category: '班级活动',
      priority: 'normal',
      pinned: 0,
      tags: '春游,植物园,集体活动',
    },
    {
      title: '家长会通知：本周五晚 19:00',
      summary: '本学期第一次家长会将于本周五晚 19:00 在本班教室召开，请家长准时参加。',
      content: CONTENT('家长会通知：本周五晚 19:00', [
        '## 议程',
        '- 19:00 - 19:30 班主任汇报',
        '- 19:30 - 20:00 各科任老师反馈',
        '- 20:00 - 20:30 家校沟通',
        '请各位家长准时参加，欢迎对班级工作提出建议。',
      ]),
      coverImage: COVER('parent94'),
      category: '重要公告',
      priority: 'high',
      pinned: 0,
      tags: '家长会,通知',
    },
    {
      title: '英语演讲比赛：我班陈静闯入决赛',
      summary: '热烈祝贺我班陈静同学在校英语演讲比赛中以"The Power of Persistence"为主题闯入决赛，将与高二组选手同台竞技。',
      content: CONTENT('英语演讲比赛：我班陈静闯入决赛', [
        '陈静同学凭借流利的口语、真挚的表达，以"The Power of Persistence"为主题的演讲获得评委一致好评。',
        '决赛时间：下周五 14:00',
        '决赛地点：学校大礼堂',
        '欢迎同学们到场为陈静加油！',
      ]),
      coverImage: COVER('english94'),
      category: '校园新闻',
      priority: 'normal',
      pinned: 0,
      tags: '英语,演讲,决赛',
    },
  ]

  for (const e of events) {
    await db.event.create({
      data: {
        ...e,
        publishedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000),
        viewCount: Math.floor(Math.random() * 200) + 20,
      },
    })
  }

  // 表白墙示例
  const confessions = [
    { nickname: '小A', content: '感谢班主任这一年的悉心教导，老师您辛苦了！', type: 'thanks', color: 'amber' },
    { nickname: '匿名同学', content: '表白九四班所有人，你们是最棒的！', type: 'confession', color: 'rose' },
    { nickname: '星辰', content: '希望期中考能进年级前 50，加油自己！', type: 'wish', color: 'sky' },
    { nickname: '吐槽君', content: '食堂阿姨能不能少放点盐啊 😅', type: 'complain', color: 'orange' },
    { nickname: '小B', content: '祝福九四班 2026 一切顺利，大家都能考上理想的学校！', type: 'bless', color: 'emerald' },
    { nickname: '匿名', content: '感谢学习委员张华，复习资料整理得超详细！', type: 'thanks', color: 'amber' },
  ]
  for (const c of confessions) {
    await db.confession.create({
      data: { ...c, likes: Math.floor(Math.random() * 30) },
    })
  }

  // 留言示例
  const messages = [
    { nickname: '家长代表', content: '班级网站做得很好，能看到孩子们的成长，谢谢老师！', contact: '家长群' },
    { nickname: '校友', content: '看到九四班越来越好，真为学弟学妹们开心！', contact: '' },
    { nickname: '学生家长', content: '建议增加月考成绩查询入口，方便家长了解孩子情况。', contact: 'wechat:xxx' },
  ]
  for (const m of messages) {
    const msg = await db.message.create({
      data: { ...m, likes: Math.floor(Math.random() * 10) },
    })
    // 给第三条加管理员回复
    if (m.content.includes('月考成绩')) {
      await db.message.create({
        data: {
          nickname: '管理员',
          content: '感谢建议，月考成绩涉及隐私，暂时不公开，家长可单独联系班主任了解。',
          contact: '',
          parentId: msg.id,
          replyRole: 'admin',
        },
      })
    }
  }

  // 模拟一些访问记录
  for (let i = 0; i < 30; i++) {
    await db.visit.create({
      data: {
        path: '/',
        ipHash: Math.random().toString(36).slice(2, 10),
        ua: 'Mozilla/5.0',
        referrer: '',
        visitedAt: new Date(Date.now() - i * 3600000 * 2),
      },
    })
  }

  console.log('Seed completed!')
  console.log(`- Events: ${await db.event.count()}`)
  console.log(`- Confessions: ${await db.confession.count()}`)
  console.log(`- Messages: ${await db.message.count()}`)
  console.log(`- Visits: ${await db.visit.count()}`)
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
