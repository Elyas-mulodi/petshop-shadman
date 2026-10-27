import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import PageHeader from "../../components/admin/ui/PageHeader";
import Button from "../../components/admin/ui/Button";
import RangePicker from "../../components/admin/dashboard/RangePicker";
import SalesChart from "../../components/admin/dashboard/SalesChart";
import {
  KpiGrid,
  LiveStrip,
  LowStockCard,
  RecentOrdersCard,
} from "../../components/admin/dashboard/OperationsWidgets";
import {
  BreakdownCard,
  CustomersCard,
  DiscountsCard,
  FunnelCard,
  GeoCard,
  PatternsCard,
  StatusCard,
  TopProductsCard,
} from "../../components/admin/dashboard/AnalyticsWidgets";
import { useDashboardRange } from "../../features/admin/dashboard/useDashboardRange";
import { useOverview } from "../../features/admin/dashboard/useDashboard";
import { formatDayLong } from "../../utils/tehranDate";

const AdminDashboardPage = () => {
  const queryClient = useQueryClient();
  const { preset, range, setPreset, setCustom } = useDashboardRange();
  const overview = useOverview(range);
  const fetching = useIsFetching({ queryKey: ["admin", "dashboard"] }) > 0;

  const shown = overview.data?.range ?? range;

  return (
    <>
      <PageHeader
        title="داشبورد"
        description={`${formatDayLong(shown.from)} تا ${formatDayLong(shown.to)}`}
        actions={
          <>
            <RangePicker
              preset={preset}
              range={range}
              onPreset={setPreset}
              onCustom={setCustom}
            />
            <Button
              variant="secondary"
              size="icon"
              aria-label="تازه‌سازی گزارش‌ها"
              title="تازه‌سازی"
              disabled={fetching}
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["admin", "dashboard"],
                })
              }
            >
              <RefreshCw
                className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`}
              />
            </Button>
          </>
        }
      />

      <div className="space-y-6">
        <KpiGrid query={overview} />
        <LiveStrip query={overview} />

        <SalesChart range={range} />

        <div className="grid gap-6 lg:grid-cols-2">
          <StatusCard range={range} />
          <FunnelCard range={range} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <TopProductsCard range={range} />
          <BreakdownCard range={range} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <CustomersCard range={range} />
          <DiscountsCard range={range} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <PatternsCard range={range} />
          <GeoCard range={range} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <LowStockCard />
          <RecentOrdersCard />
        </div>
      </div>
    </>
  );
};

export default AdminDashboardPage;
