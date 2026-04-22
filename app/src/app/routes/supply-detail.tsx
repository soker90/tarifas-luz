import { useParams } from "react-router";
import { AddReadingDialog } from "@/features/supply-detail/components/add-reading-dialog";
import { ConsumptionChart } from "@/features/supply-detail/components/consumption-chart";
import { DeleteReadingDialog } from "@/features/supply-detail/components/delete-reading-dialog";
import { EditReadingDialog } from "@/features/supply-detail/components/edit-reading-dialog";
import { EditSupplyDialog } from "@/features/supply-detail/components/edit-supply-dialog";
import { ReadingsTable } from "@/features/supply-detail/components/readings-table";
import { StatsCards } from "@/features/supply-detail/components/stats-cards";
import { SupplyHeader } from "@/features/supply-detail/components/supply-header";
import { TrendChart } from "@/features/supply-detail/components/trend-chart";
import { useSupplyDetail } from "@/features/supply-detail/use-supply-detail";

const SupplyDetailPage = () => {
  const { supplyId } = useParams<{ supplyId: string }>();
  const {
    supply,
    datosGenerales,
    sortedReadings,
    paginatedReadings,
    totalPages,
    currentPage,
    setCurrentPage,
    availableYears,
    currentSelectedYear,
    setSelectedYear,
    chartData,
    lastYearChartData,
    opacity,
    handleLegendMouseEnter,
    handleLegendMouseLeave,
    isAddDialogOpen,
    setIsAddDialogOpen,
    readingToEdit,
    setReadingToEdit,
    isEditSupplyDialogOpen,
    setIsEditSupplyDialogOpen,
    readingToDelete,
    setReadingToDelete,
    handleAddReading,
    handleEditReading,
    handleEditSupply,
    confirmDeleteReading,
    statsPeak,
    statsFlat,
    statsOffPeak,
    statsTotalKwh,
    dailyAverage,
    accumulatedCost,
  } = useSupplyDetail(supplyId);

  if (supply === undefined) {
    return <div className="p-12 text-center">Cargando...</div>;
  }
  if (supply === null) {
    return (
      <div className="p-12 text-center text-destructive">
        Suministro no encontrado.
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl p-6">
      <DeleteReadingDialog
        onClose={() => setReadingToDelete(null)}
        onConfirm={confirmDeleteReading}
        open={!!readingToDelete}
      />
      <EditReadingDialog
        onClose={() => setReadingToEdit(null)}
        onSave={handleEditReading}
        reading={readingToEdit}
      />
      <EditSupplyDialog
        onClose={() => setIsEditSupplyDialogOpen(false)}
        onSave={handleEditSupply}
        open={isEditSupplyDialogOpen}
        supply={supply}
      />
      <AddReadingDialog
        onAdd={handleAddReading}
        onClose={() => setIsAddDialogOpen(false)}
        open={isAddDialogOpen}
      />

      <SupplyHeader
        onAddReadingClick={() => setIsAddDialogOpen(true)}
        onEditClick={() => setIsEditSupplyDialogOpen(true)}
        supply={supply}
        supplyId={supplyId ?? ""}
      />

      {sortedReadings.length > 0 && (
        <StatsCards
          accumulatedCost={accumulatedCost}
          dailyAverage={dailyAverage}
          statsFlat={statsFlat}
          statsOffPeak={statsOffPeak}
          statsPeak={statsPeak}
          statsTotalKwh={statsTotalKwh}
        />
      )}

      {sortedReadings.length > 0 && (
        <ConsumptionChart
          availableYears={availableYears}
          chartData={chartData}
          currentSelectedYear={currentSelectedYear}
          onYearChange={setSelectedYear}
        />
      )}

      {lastYearChartData.length > 0 && (
        <TrendChart
          data={lastYearChartData}
          onLegendMouseEnter={handleLegendMouseEnter}
          onLegendMouseLeave={handleLegendMouseLeave}
          opacity={opacity}
        />
      )}

      <ReadingsTable
        allReadingsCount={sortedReadings.length}
        currentPage={currentPage}
        datosGenerales={datosGenerales}
        onDeleteReading={setReadingToDelete}
        onEditReading={setReadingToEdit}
        onPageChange={setCurrentPage}
        readings={paginatedReadings}
        supply={supply}
        totalPages={totalPages}
      />
    </div>
  );
};

export const Component = SupplyDetailPage;
