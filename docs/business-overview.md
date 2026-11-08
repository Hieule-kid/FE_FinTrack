# FinTrack FE — Tổng quan nghiệp vụ

> **Đối tượng:** dev FE/BE, reviewer, người mới vào dự án.
> **Mục đích:** mô tả FE đang làm gì về mặt nghiệp vụ, quy tắc nào đang được áp dụng, và chỗ nào còn thiếu.
> **Cập nhật:** 2026-11-08, dựa trên code ở nhánh `main` (commit `20659ea`).
>
> Chi tiết kỹ thuật từng luồng xem thêm: [`auth-login-flow.md`](./auth-login-flow.md), [`auth-profile-management.md`](./auth-profile-management.md), [`i18n-implementation.md`](./i18n-implementation.md).
> ⚠️ [`fe-logic-flow.md`](./fe-logic-flow.md) đã **lỗi thời** (vẫn mô tả dashboard dùng mock data và form tạo plan chưa gọi API).

---

## 1. FinTrack giải quyết bài toán gì

Người dùng đặt **mục tiêu tiết kiệm** (mua nhà, mua xe, du lịch, quỹ khẩn cấp…) với **số tiền mục tiêu** và **thời hạn**. Hệ thống chia mục tiêu thành các **milestone** (mốc theo kỳ), người dùng ghi nhận số tiền thực tế đã để dành mỗi kỳ và theo dõi tiến độ. Song song, người dùng **ghi chép chi tiêu** để biết tiền đang đi đâu.

```
User ──┬── Plan (mục tiêu tiết kiệm) ──── Milestone[] (mốc theo kỳ)
       │
       └── Expense[] (chi tiêu) ──── ExpenseCategory (danh mục)
                │
                └── planId? (có field nhưng FE chưa dùng — xem §8)
```

| Khái niệm           | Ý nghĩa                                                                                           | Type                             |
| ------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------- |
| **Plan**            | Một mục tiêu tiết kiệm: số tiền, tiền tệ, thời hạn, tần suất góp                                  | `src/features/planning/types.ts` |
| **Milestone**       | Một kỳ góp: số cần góp (`targetSavings`), số đã góp (`actualSaved`), hạn (`deadline`), trạng thái | `src/features/planning/types.ts` |
| **Expense**         | Một khoản chi: số tiền, tiền tệ, ngày chi, danh mục, loại FIXED/VARIABLE                          | `src/features/expenses/types.ts` |
| **ExpenseCategory** | Danh mục chi tiêu; 6 danh mục hệ thống + danh mục người dùng tự tạo                               | `src/features/expenses/types.ts` |
| **User profile**    | Họ tên, email, **tiền tệ mặc định** (USD/VND), roles                                              | `src/features/auth/types.ts`     |

---

## 2. Kiến trúc gọi backend (tóm tắt)

| Tính năng                                    | Đường gọi                                                          | Backend          |
| -------------------------------------------- | ------------------------------------------------------------------ | ---------------- |
| Auth (login/register/logout/refresh)         | Browser → `/api/auth/*` (BFF route)                                | auth-service     |
| Profile, đổi tiền tệ                         | Browser → `/api/users/profile`, `/api/users/currency`, `/api/user` | auth-service     |
| Plan: list, get, create, delete, AI generate | Server action `planning.facade.ts`                                 | planning-service |
| Milestone: sửa số tiền, complete, undo       | Browser → `/api/planning/[...path]` (BFF proxy)                    | planning-service |
| Plan detail (refetch phía client)            | Browser → `/api/planning/[...path]`                                | planning-service |
| Expenses + categories                        | Server action `expenses.facade.ts`                                 | planning-service |

- Token nằm trong cookie HttpOnly (`access_token` 15 phút, `refresh_token` 7 ngày, `roles` 1 ngày). JS phía client không đọc được.
- **Silent refresh chỉ có ở BFF proxy `/api/planning/[...path]`** (khi cookie mất hoặc upstream trả 401). Server actions **không** refresh. Khi token hết hạn, server action gửi token rỗng và nhận về `[]`/`null`.
- Client nhận 401 → `src/services/interceptor.ts` gọi logout và chuyển về `/login`.

---

## 3. Auth & phân quyền

### Luồng

1. **Register** (`/register`): `fullName?`, `username`, `email`, `password`, `currency`. Không tự đăng nhập; thành công thì chuyển về `/login`.
2. **Login** (`/login`): `emailOrUsername` + `password`. BFF chuẩn hoá tên field token, set 3 cookie. Nếu auth-service đang cold-start (502/503/504 hoặc lỗi mạng), FE poll `/api/warmup/auth` rồi thử lại một lần (`use-auth.ts`).
3. **Logout**: luôn xoá cookie, kể cả khi backend lỗi.
4. **Trang `/`**: có `access_token` thì chuyển sang `/dashboard`, không có thì sang `/login`.

### Route guard (`src/proxy.ts`)

| Route                                        | Bảo vệ                                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------------- |
| `/dashboard/*`, `/expenses/*`, `/settings/*` | Cần cookie `access_token`                                                        |
| `/admin/*`                                   | Cần `access_token` **và** role `ADMIN` (so khớp chính xác, phân biệt hoa thường) |
| `/plan/*`                                    | ⚠️ **Không có trong matcher** — xem §8                                           |

---

## 4. Plan tiết kiệm

### 4.1 Tạo plan thủ công — `/plan/create`

File: `src/app/plan/create/create-plan-content.tsx`

**Các trường và quy tắc**

| Trường              | Quy tắc                                                                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Category (tuỳ chọn) | 8 loại: `emergency`, `travel`, `house`, `car`, `education`, `wedding`, `retirement`, `other`. Chọn category sẽ tự điền tiêu đề mặc định, timeframe và thời hạn gợi ý. Gửi lên dạng **UPPERCASE**        |
| Title               | Tối đa 50 ký tự, có thể để trống                                                                                                                                                                        |
| Target amount       | Mặc định 10.000.000 VND hoặc 1.000 USD. VND làm tròn số nguyên, USD lấy 2 chữ số thập phân                                                                                                              |
| Currency            | Lấy từ profile; **mặc định `VND` nếu profile chưa load xong**                                                                                                                                           |
| Timeframe           | `short` 1–11 tháng · `mid` 12–60 tháng · `long` 61–360 tháng. Gửi `SHORT_TERM` / `MID_TERM` / `LONG_TERM`                                                                                               |
| Duration            | Preset theo timeframe (short: 3/6/9/11 · mid: 12/24/36/60 · long: 72/120/180/240), nhập tay, hoặc chọn **tháng mục tiêu** (`YYYY-MM`). Khi chọn tháng mục tiêu, FE tự tính số tháng và tự đổi timeframe |
| Frequency           | `daily` hoặc `monthly` (gửi UPPERCASE). Type có `WEEKLY` nhưng UI không cho chọn                                                                                                                        |
| Required per period | Tự tính; người dùng sửa được, khi đó **target amount được tính ngược lại**                                                                                                                              |
| Start date          | Luôn là **hôm nay** (giờ local)                                                                                                                                                                         |

**Công thức**

```
monthly:  requiredPerPeriod = targetAmount / durationInMonths
daily:    requiredPerPeriod = targetAmount / (durationInMonths × 30)     ← quy ước 1 tháng = 30 ngày

Sửa ngược: targetAmount = requiredPerPeriod × (durationInMonths | durationInMonths × 30)

durationInYears = clamp(round(durationInMonths / 12), 1, 20)
monthsFromTargetDate = max(1, (năm − năm nay) × 12 + (tháng − tháng này))
```

**Validation khi submit:** duration phải nằm trong khoảng của timeframe, và `requiredPerPeriod > 0`.
**Thành công:** `revalidatePath("/dashboard")` rồi chuyển sang `/dashboard`.

### 4.2 Tạo plan bằng AI — `/plan/ai-generate`

File: `src/app/plan/ai-generate/ai-generate-content.tsx`. Nút vào trang này trên dashboard **đang bị comment** (TODO); chỉ vào được bằng URL trực tiếp.

1. Người dùng nhập prompt bằng ngôn ngữ tự nhiên (thu nhập, mục tiêu, thời hạn).
2. BE trả về `totalBudget`, `currency`, `term`, danh sách `categories` phân bổ ngân sách (tên, %, số tiền), và `aiAdvice`.
3. Khi tạo plan, FE:
   - lấy `requiredPerPeriod` = số tiền của category đầu tiên có tên khớp regex `/sav|invest/i`, **không có thì bằng 0**
   - `targetAmount = requiredPerPeriod × duration`
   - duration mặc định: `term = ANNUALLY` → 12 tháng, còn lại → 6 tháng
   - `frequency = term` (ví dụ `MONTHLY`, `ANNUALLY`)

### 4.3 Dashboard — `/dashboard`

File: `src/app/dashboard/dashboard-content.tsx`. Dữ liệu lấy từ server action `getPlans()`.

| Chỉ số          | Cách tính                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------- |
| Total Target    | Tổng `targetAmount` của **mọi** plan, định dạng compact (`1.2M`), **không kèm đơn vị tiền tệ** |
| Active plans    | Plan có `progressPercent < 100`                                                                |
| Completed plans | Plan có `progressPercent >= 100` (không dựa vào field `status`)                                |

Mỗi plan card hiển thị `totalSaved / targetAmount`, frequency và timeframe; bấm vào card để mở `/plan/[id]`, có nút xoá plan.

### 4.4 Chi tiết plan & milestone — `/plan/[id]`

Files: `src/app/plan/[id]/*`

- Server load plan bằng server action, sau đó client **refetch lại** qua BFF proxy.
- 4 thẻ thống kê: Target, Saved, Remaining, Progress %. **Mọi con số đều do BE tính**, FE chỉ hiển thị.
- Bảng milestone gồm các cột: Period (`timeline`), Target, Actual Saved, Deadline, Status (`PENDING` / `COMPLETED` / `MISSED`).

| Hành động     | API                                         | Quy tắc FE                                             |
| ------------- | ------------------------------------------- | ------------------------------------------------------ |
| Sửa số đã góp | `PATCH …/milestones/{id}` `{ actualSaved }` | `actualSaved >= 0`                                     |
| Complete      | `POST …/milestones/{id}/complete`           | Hiện khi status ≠ `COMPLETED`                          |
| Undo          | `POST …/milestones/{id}/undo`               | Hiện khi status = `COMPLETED`                          |
| Xoá plan      | Server action `deletePlan`                  | Có hộp xác nhận; xoá cả milestone, không hoàn tác được |

Mỗi hành động BE trả về `PlanDetail` mới; FE cập nhật bảng và các thẻ thống kê từ dữ liệu đó.

**Recalculate on missed deadline:** toggle "dồn số tiền bị trễ đều vào các milestone sau". Hiện tại **chỉ hiển thị, không bấm được** (`recalculateOnMissedDeadline` lấy từ BE).

---

## 5. Chi tiêu (Expenses) — `/expenses`

Files: `src/app/expenses/*`, `src/features/expenses/*`

### 5.1 Ghi chi tiêu

| Trường   | Quy tắc                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| Amount   | `>= 0.01`, tối đa 2 chữ số thập phân, tự thêm dấu phân cách hàng nghìn khi gõ                                  |
| Currency | Mã 3 ký tự, tự viết hoa; mặc định là tiền tệ trong profile (**`USD` nếu profile chưa load**)                   |
| Category | Bắt buộc                                                                                                       |
| Spent on | `YYYY-MM-DD`, **không được ở tương lai**                                                                       |
| Note     | Tối đa 255 ký tự                                                                                               |
| Type     | Khi tạo mới, BE tự gán theo `defaultType` của category. Khi sửa, người dùng có thể **override** FIXED/VARIABLE |

- **Thêm nhiều khoản (bulk):** tối đa **50 dòng**, dùng chung một currency. Dòng mới kế thừa category và ngày của dòng trước. BE xử lý **tất cả hoặc không gì cả** (lỗi thì không dòng nào được lưu).
- **Xoá:** có hộp xác nhận, không hoàn tác được.

### 5.2 Danh mục

- 6 danh mục hệ thống (`isSystem = true`) do BE tự tạo sẵn, cộng với danh mục người dùng tạo (tên tối đa 50 ký tự, `defaultType` FIXED hoặc VARIABLE).
- Chỉ **tạo** được; chưa sửa hay xoá được.

### 5.3 Lọc, phân trang, tổng

- Bộ lọc: khoảng ngày (phải nhập **cả hai hoặc bỏ trống cả hai**, `to >= from`), loại, danh mục. Mặc định là toàn bộ thời gian.
- Phân trang 20 dòng/trang.
- **Summary do server tính** trên **toàn bộ** chi tiêu khớp bộ lọc, không phụ thuộc trang đang xem: Spent / Fixed / Variable, **tách theo từng currency, không bao giờ cộng gộp**. Tiền trả về dạng **chuỗi decimal** để không mất độ chính xác.
- Summary lỗi thì hiện `--` kèm nút Retry; danh sách vẫn hoạt động bình thường.
- Sau khi thêm, sửa hoặc xoá, summary được tải lại; danh sách được cập nhật lạc quan (optimistic) ngay trên client.

---

## 6. Settings — `/settings`

- Sửa họ tên, email, currency (`authService.updateProfile`).
- Đổi currency nhanh (`authService.updateCurrency`); lỗi thì quay lại giá trị cũ.
- **Đổi currency không quy đổi** plan hay expense đã có. Mỗi plan/expense giữ currency riêng của nó; currency trong profile chỉ là **giá trị mặc định cho bản ghi mới**.

---

## 7. Quy tắc tiền tệ & số tiền (xuyên suốt)

| Quy tắc                                                                        | Nơi áp dụng                                             |
| ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Chỉ hỗ trợ `USD` và `VND` trong UI (`currencyOptions`)                         | Settings, register, bulk expense                        |
| VND: số nguyên, phân cách kiểu `vi-VN` (`10.000.000`); USD: 2 chữ số thập phân | Tạo plan, AI plan                                       |
| Tiền trong Plan, Milestone, Expense là `number` (float JS)                     | Mọi nơi trừ expense summary                             |
| Expense summary trả tiền dạng `string` decimal                                 | `/expenses`                                             |
| Không cộng gộp tiền khác currency                                              | Expense summary ✅ · Dashboard Total Target ❌ (xem §8) |

---

## 8. Điểm còn thiếu / rủi ro nghiệp vụ

Ưu tiên: 🔴 sai dữ liệu hoặc bảo mật · 🟠 sai trải nghiệm hoặc gây hiểu nhầm · 🟡 thiếu tính năng hoặc nợ kỹ thuật.

| #   | Mức | Vấn đề                                                  | Chi tiết                                                                                                                                 | Vị trí                                                |
| --- | --- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | 🔴  | Dashboard cộng tiền khác currency                       | `totalTarget` cộng `targetAmount` của mọi plan bất kể USD hay VND, và không hiển thị đơn vị                                              | `dashboard-content.tsx`                               |
| 2   | 🔴  | Tạo plan khi profile chưa load → sai currency           | Tạo plan mặc định `VND`, còn expenses/settings mặc định `USD`. User USD submit sớm có thể tạo plan VND                                   | `create-plan-content.tsx`, `expenses-content.tsx`     |
| 3   | 🔴  | AI plan có thể tạo plan target = 0                      | Không có category khớp `/sav\|invest/i` → `requiredPerPeriod = 0` → `targetAmount = 0`, và không có validation chặn                      | `ai-generate-content.tsx`                             |
| 4   | 🟠  | `/plan/*` không được route guard bảo vệ                 | Không có trong matcher của `proxy.ts`. Hết phiên vẫn mở được form tạo plan, submit thì chỉ báo lỗi chung chung                           | `src/proxy.ts`                                        |
| 5   | 🟠  | Server actions không refresh token                      | Token hết hạn → `getPlans()` trả `[]` → dashboard báo "không có plan" thay vì yêu cầu đăng nhập lại                                      | `planning.facade.ts`, `expenses.facade.ts`            |
| 6   | 🟠  | Chi tiêu chưa liên kết với plan                         | `Expense.planId` có trong type và API nhưng UI không cho gán. Chưa trả lời được câu hỏi "chi tiêu ảnh hưởng mục tiêu tiết kiệm thế nào"  | `features/expenses`                                   |
| 7   | 🟠  | "Completed" dựa vào `progressPercent >= 100`            | Bỏ qua `status` (`ACTIVE` / `COMPLETED` / `PAUSED`). Plan `PAUSED` vẫn hiện như đang active                                              | `dashboard-content.tsx`                               |
| 8   | 🟠  | `durationInYears` bị chặn ở 20                          | Long-term cho nhập đến 360 tháng (30 năm) nhưng gửi `durationInYears = 20`, không khớp `durationInMonths`                                | `create-plan-content.tsx`                             |
| 9   | 🟠  | Daily frequency quy ước 1 tháng = 30 ngày               | Số kỳ thực tế lệch so với lịch. Cần thống nhất công thức với BE (BE mới là bên sinh milestone)                                           | `create-plan-content.tsx`                             |
| 10  | 🟠  | Tháng mục tiêu bỏ qua ngày                              | Chọn tháng sau vào ngày 30 vẫn tính là 1 tháng                                                                                           | `calcMonthsFromToday`                                 |
| 11  | 🟠  | Xoá plan/expense lỗi mà không báo                       | Khi `ok = false`, modal đóng lại và không hiện thông báo lỗi                                                                             | `delete-plan-button.tsx`, `delete-expense-button.tsx` |
| 12  | 🟠  | Bộ lọc expenses chưa "Apply" vẫn ảnh hưởng summary      | Sửa bộ lọc trong modal rồi bấm Cancel → state không được reset; lần tải lại summary sau đó dùng bộ lọc chưa áp dụng                      | `expenses-content.tsx`                                |
| 13  | 🟡  | Toggle "Recalculate on missed deadline" chỉ để hiển thị | Chưa có API hay handler để bật/tắt                                                                                                       | `plan-detail-loader.tsx`                              |
| 14  | 🟡  | Chưa sửa được plan                                      | `updatePlan` có trong facade nhưng không có UI nào gọi                                                                                   | `planning.facade.ts`                                  |
| 15  | 🟡  | Milestone gọi qua 2 đường khác nhau                     | UI gọi BFF proxy; `updateMilestone` / `completeMilestone` trong facade không được dùng; `undo` chỉ có ở client                           | `milestones-table.tsx`                                |
| 16  | 🟡  | Chưa sửa hoặc xoá được danh mục chi tiêu                | Chỉ tạo được                                                                                                                             | `category-manager-modal.tsx`                          |
| 17  | 🟡  | Nút "View all" completed plans trỏ tới `#`              | Chưa có trang danh sách đầy đủ                                                                                                           | `dashboard-content.tsx`                               |
| 18  | 🟡  | AI generate bị ẩn khỏi dashboard                        | Nút đang bị comment (TODO)                                                                                                               | `dashboard-actions.tsx`                               |
| 19  | 🟡  | Tiền dùng float JS                                      | Plan và milestone dùng `number`, có thể lệch khi cộng số thập phân (USD). Expense summary đã dùng chuỗi decimal, nên thống nhất cách làm | `planning/types.ts`                                   |
| 20  | 🟡  | i18n chưa phủ hết                                       | Expenses, plan detail, milestone, thông báo lỗi validation đều hardcode tiếng Anh                                                        | nhiều file                                            |
| 21  | 🟡  | Trang admin chỉ là placeholder                          | Chưa có chức năng gì                                                                                                                     | `(protected)/admin/page.tsx`                          |

---

## 9. Câu hỏi cần xác nhận với BE / Product

1. Milestone được sinh theo công thức nào (daily = 30 ngày/tháng hay theo lịch thực)? `requiredPerPeriod` do FE gửi lên có được BE dùng không, hay BE tự tính lại?
2. `progressPercent` có bị giới hạn ở 100 không? Plan khi đạt 100% có tự chuyển `status = COMPLETED` không?
3. Dashboard nên hiển thị Total Target theo từng currency (giống expense summary) hay quy đổi về currency của profile?
4. Expense có được trừ vào tiến độ plan (qua `planId`) không, hay hai phần hoàn toàn độc lập?
5. Khi người dùng đổi currency trong profile, các plan cũ xử lý thế nào?
6. `frequency = ANNUALLY` từ AI có được planning-service chấp nhận không, khi form thủ công chỉ gửi `DAILY` / `MONTHLY`?
