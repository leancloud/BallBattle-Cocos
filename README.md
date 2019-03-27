# BallBattle

## 简介

《球球大作战》是一款基于大球吃小球的房间类多人实时对战游戏。

这个工程是使用 [LeanCloud 实时对战服务](https://leancloud.cn/docs/multiplayer.html) + Cocos Creator 开发的模拟《球球大作战》demo。

## 玩法

输入房间 ID，加入房间（如果没有此房间，则创建）。
用户 ID 随机生成。
使用 ⬆️⬇️⬅️➡️ 或 WSAD 来控制小球移动，吃掉场景中的食物（三角形，方形，六边形）则会增长体重（并减少速度）；遇到其他球（玩家），碰撞之后，体重较大者获胜，较小者将会死亡并重生。
右侧面板显示当前房间的玩家体重排行榜。

## 主要功能

### [匹配对战](https://leancloud.cn/docs/multiplayer-guide-js.html#hash786861961)

最基础的房间 ID 匹配。

### [属性同步与保存](https://leancloud.cn/docs/multiplayer-guide-js.html#hash-299183039)

这个 demo 使用的是 Master Client 机制，但由于 Master Client 可能存在掉线等异常情况，所以需要将房间和玩家的部分数据保存至 Room Properties 和 Player Properties。

#### [房间属性](https://leancloud.cn/docs/multiplayer-guide-js.html#hash1532570669)

- 房间用时
- 战场的食物列表
- 食物最大 ID

#### [玩家属性](https://leancloud.cn/docs/multiplayer-guide-js.html#hash700221845)

- 位置
- 体重
- 速度

### [自定义事件](https://leancloud.cn/docs/multiplayer-guide-js.html#hash1368192228)

- 玩家出生：对于当前玩家，执行战场初始化逻辑；对于其他玩家，执行增加玩家逻辑。
- 吃食物：客户端移除内存中的食物节点，同步玩家体重。
- 杀死玩家：用于同步节点间碰撞事件。
- 玩家重生：用于重新初始化玩家数据。
- 生成食物：同步房间内的食物数据。
- 玩家离开：用于移除场景和 UI 对应节点。
- 游戏结束：用于返回主菜单场景。

### 其他功能

#### 消息处理控制

由于从主场景加载到战斗场景，存在异步的资源加载过程，所以需要暂停 / 恢复消息队列的处理。流程如下：

- 加入房间
- 暂停消息处理
- 加载战斗场景
- 初始化战场
- 恢复消息队列。

#### 移动同步

移动同步实现思路是玩家在运动状态改变时，将当前运动状态同步给其他客户端，其他客户端对玩家行为进行模拟。而在运动过程中，并不同步移动数据。

运动状态包括：

- 位置
- 移动方向
- 时间戳

模拟步骤：

- 在收到运动状态改变时，根据运动改变时的位置，方向，以及当前时间戳与运动改变时的时间戳的差值，计算出当前应该所在的位置 p0
- 玩家节点当前实际所在位置 p1，p0 - p1（向量减法），即为校正后的运动路径
- 对路径进行模拟，直至下次运动状态改变

## 项目结构

```
├── Animation 动画目录
├── Prefabs 预制目录，主要存放球，食物预制体
├── Scene 场景目录，主菜单场景，战斗场景
├── Script 脚本目录
│ ├── Battle 战斗相关脚本目录
│ ├── Ball.js 球节点控制脚本
│ ├── BallController.js 玩家控制球脚本，生成移动数据同步给其他客户端
│ ├── BallSimulator.js 玩家运动模拟脚本，根据玩家运动数据，模拟运动行为
│ ├── Battle.js 战场节点总控制器，用于接收并解析战斗中的自定义事件，驱动场景节点及 UI 节点变化
│ ├── BattleHelper.js 战场工具脚本
│ ├── Food.js 食物节点控制脚本
│ ├── Master.js 游戏逻辑脚本，用于区分 Master 客户端与普通客户端，Master 组件用于生成房间数据及逻辑判断，只有 Master 的客户端才拥有这个组件，包括最初的房间的创建者和切换后的新房主。
│ ├── PlayerInfoItem.js 玩家信息 UI 节点控制脚本
│ ├── UI.js UI 控制脚本
│ ├── Menu 主菜单相关脚本目录
│ ├── Menu.js 主菜单脚本
│ ├── Constants.js 游戏中用到的常量
│ ├── LeanCloud.js 全局存放 LeanCloud SDK 对象的脚本
├── Texture 素材资源目录
└── play.js LeanCloud 实时对战服务 SDK
```
