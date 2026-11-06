# NTT GROUP — Shared UI Components

This folder contains reusable presentation components for future NTT GROUP modules.
They are intentionally presentation-only: no API calls, Firebase writes, permission decisions,
or business rules are embedded in these components.

## Import

```tsx
import {
  NttPageHeader,
  NttFilterPanel,
  NttStatusBadge,
  NttEmptyState,
  NttDataTable,
} from "./ui";
```

## Page header

```tsx
<NttPageHeader
  eyebrow="NTT BUSINESS"
  title="Quản lý công việc"
  description="Theo dõi và điều phối công việc trong hệ thống."
  icon={<BriefcaseBusiness size={20} />}
  actions={<button type="button">Tạo mới</button>}
/>
```

## Filter panel

```tsx
<NttFilterPanel title="Bộ lọc công việc" onReset={resetFilters}>
  <label>
    Từ khóa
    <input value={keyword} onChange={(event) => setKeyword(event.target.value)} />
  </label>
  <label>
    Trạng thái
    <select value={status} onChange={(event) => setStatus(event.target.value)}>
      <option value="all">Tất cả</option>
      <option value="open">Đang xử lý</option>
    </select>
  </label>
</NttFilterPanel>
```

## Status badge

```tsx
<NttStatusBadge tone="success">Hoàn thành</NttStatusBadge>
<NttStatusBadge tone="warning">Chờ xử lý</NttStatusBadge>
<NttStatusBadge tone="danger">Quá hạn</NttStatusBadge>
```

## Empty state

```tsx
<NttEmptyState
  title="Chưa có công việc"
  description="Thử thay đổi bộ lọc hoặc tạo công việc mới."
  action={<button type="button">Tạo công việc</button>}
/>
```

## Data table

```tsx
<NttDataTable
  columns={[
    { key: "code", title: "Mã", render: (row) => row.code },
    { key: "name", title: "Tên công việc", render: (row) => row.name },
    { key: "status", title: "Trạng thái", render: (row) => <NttStatusBadge>{row.status}</NttStatusBadge> },
  ]}
  rows={rows}
  getRowKey={(row) => row.id}
  minWidth={760}
/>
```

## Integration rule

When adding a new module, use these components as the default visual building blocks.
Keep module-specific state, validation, Firebase operations, access control, and audit logging
inside that module's service/hooks layer. Do not put security rules in UI components.
