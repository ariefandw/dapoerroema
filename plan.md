1. Remove Pusher install and just use SWR for polling. This avoids introducing a new dependency.
2. In `OrderClientPage`, use SWR to poll the API `/api/orders` to get live order list data.
3. Replace the `orders` prop passed to `OrdersTable` with the dynamically fetched `orders` data using SWR.
4. Update `app/(app)/order/[id]/page.tsx` to pass the initial `order` data to a new client component `OrderDetailClientPage`.
5. Create `OrderDetailClientPage` which renders the UI and uses SWR to poll the `/api/orders/[id]` endpoint.
6. The client component will also implement a polling strategy or listen to SWR updates. SWR has built-in auto-refresh.
7. Also, the order detail page lacks the ability to update the status (except for admins/runners). But the prompt says "On the order detail page, user with the right role also can change the order status just like in the order list page." Looking at `src/app/(app)/order/[id]/page.tsx`, it only shows `VerticalStatusStepper` which is view-only. I need to add `StatusStepper` (which supports changing status) inside the `OrderDetailClientPage` as well.
8. Add a pre-commit step.
