## 1. 架构设计

```mermaid
graph TD
    A["用户浏览器大屏"] --> B["React 18 + TypeScript 前端"]
    B --> C["Zustand 全局状态管理"]
    C --> D["筛选状态 Store"]
    C --> E["数据聚合 Store"]
    C --> F["UI 交互 Store"]
    B --> G["Mock 数据服务层"]
    G --> H["门店基础数据生成器"]
    G --> I["采样点时序数据生成器"]
    G --> J["告警规则引擎"]
    B --> K["组件层"]
    K --> L["FilterBar 筛选栏"]
    K --> M["StoreCard 门店卡片"]
    K --> N["StackedBar 堆叠条"]
    K --> O["Timeline 时间轴"]
    K --> P["BacklogModal 积压弹窗"]
```

## 2. 技术说明

- **前端**：React@18 + TypeScript + Vite + TailwindCSS@3 + Zustand@4 + lucide-react
- **初始化工具**：vite-init (react-ts 模板)
- **后端**：无后端，纯前端 Mock 数据层
- **数据持久化**：localStorage 存储免责标签勾选状态（可选）

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| `/` | 监控大屏主页（单页应用唯一页面） |

## 4. API 定义

无后端，全部使用 Mock 数据生成函数：

```typescript
// 类型定义
interface Brand {
  id: string;
  name: '星巴克' | '瑞幸' | 'Manner' | '喜茶' | '奈雪' | '蜜雪冰城';
  primaryColor: string;
  secondaryColor: string;
}

interface Store {
  id: string;
  brandId: string;
  name: string; // e.g. "星巴克 1788广场店"
  branch: number; // 1 or 2
}

interface SamplePoint {
  timestamp: number; // 毫秒时间戳
  storeId: string;
  cups: number; // 30分钟出杯数
  avgOrderValue: number; // 客单价
  waitTime: { median: number; p95: number }; // 等单时长 中位数/秒
  stages: {
    wait: number; // 等单阶段耗时中位数/秒
    make: number; // 制作阶段耗时中位数/秒
    pickup: number; // 取餐阶段耗时中位数/秒
  };
  sampleSize: number; // 样本量（订单数）
}

interface BacklogAlert {
  id: string;
  storeId: string;
  startTime: number;
  endTime: number;
  severity: number; // 超出均值百分比
  samplePoints: number[]; // 触发告警的采样点时间戳
  pendingOrders: PendingOrder[]; // 未完成取餐号
  exempted: boolean; // 是否已被免责标签覆盖
}

interface PendingOrder {
  orderNo: string; // e.g. "A056"
  placedAt: number;
  stage: 'wait' | 'make' | 'pickup';
  elapsedSec: number;
}

// 数据服务接口
interface DataService {
  getBrands(): Brand[];
  getStores(brandIds?: string[]): Store[];
  getSamplePoints(date: string, storeIds: string[], rangeStart: number, rangeEnd: number): SamplePoint[];
  getAggregatedStats(samples: SamplePoint[]): StoreStats[];
  getBacklogAlerts(date: string, storeIds: string[]): BacklogAlert[];
}

interface StoreStats {
  storeId: string;
  rank: { cups: number; aov: number; wait: number };
  cups: number;
  avgOrderValue: number;
  waitMedian: number;
  stages: { wait: number; make: number; pickup: number };
  sampleSize: number;
  alert?: BacklogAlert;
}
```

## 5. 服务器架构图

不适用（纯前端应用）

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    BRAND ||--o{ STORE : "拥有"
    STORE ||--o{ SAMPLE_POINT : "产生"
    STORE ||--o{ BACKLOG_ALERT : "触发"
    BACKLOG_ALERT ||--o{ PENDING_ORDER : "包含"
    BRAND {
        string id PK
        string name
        string primaryColor
    }
    STORE {
        string id PK
        string brandId FK
        string name
        int branch
    }
    SAMPLE_POINT {
        bigint timestamp PK
        string storeId FK
        int cups
        float avgOrderValue
        int wait_median
        int stage_wait
        int stage_make
        int stage_pickup
        int sample_size
    }
    BACKLOG_ALERT {
        string id PK
        string storeId FK
        bigint start_time
        bigint end_time
        float severity
        boolean exempted
    }
    PENDING_ORDER {
        string order_no PK
        string alertId FK
        bigint placed_at
        string stage
        int elapsed_sec
    }
```

### 6.2 数据定义语言

无持久化数据库，全部为内存 Mock 数据生成
