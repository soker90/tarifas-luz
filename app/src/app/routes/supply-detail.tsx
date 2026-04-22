import { useParams } from "react-router";
import { useSupplyDetail } from "@/features/supply-detail/use-supply-detail";
import { AddReadingDialog } from "@/features/supply-detail/components/add-reading-dialog";
import { ConsumptionChart } from "@/features/supply-detail/components/consumption-chart";
import { DeleteReadingDialog } from "@/features/supply-detail/components/delete-reading-dialog";
import { EditReadingDialog } from "@/features/supply-detail/components/edit-reading-dialog";
import { EditSupplyDialog } from "@/features/supply-detail/components/edit-supply-dialog";
import { ReadingsTable } from "@/features/supply-detail/components/readings-table";
import { StatsCards } from "@/features/supply-detail/components/stats-cards";
import { SupplyHeader } from "@/features/supply-detail/components/supply-header";
import { TrendChart } from "@/features/supply-detail/components/trend-chart";

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
        open={!!readingToDelete}
        onClose={() => setReadingToDelete(null)}
        onConfirm={confirmDeleteReading}
      />
      <EditReadingDialog
        reading={readingToEdit}
        onClose={() => setReadingToEdit(null)}
        onSave={handleEditReading}
      />
      <EditSupplyDialog
        open={isEditSupplyDialogOpen}
        supply={supply}
        onClose={() => setIsEditSupplyDialogOpen(false)}
        onSave={handleEditSupply}
      />
      <AddReadingDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddReading}
      />

      <SupplyHeader
        supply={supply}
        supplyId={supplyId ?? ""}
        onEditClick={() => setIsEditSupplyDialogOpen(true)}
        onAddReadingClick={() => setIsAddDialogOpen(true)}
      />

      {sortedReadings.length > 0 && (
        <StatsCards
          dailyAverage={dailyAverage}
          accumulatedCost={accumulatedCost}
          statsPeak={statsPeak}
          statsFlat={statsFlat}
          statsOffPeak={statsOffPeak}
          statsTotalKwh={statsTotalKwh}
        />
      )}

      {sortedReadings.length > 0 && (
        <ConsumptionChart
          chartData={chartData}
          availableYears={availableYears}
          currentSelectedYear={currentSelectedYear}
          onYearChange={setSelectedYear}
        />
      )}

      {lastYearChartData.length > 0 && (
        <TrendChart
          data={lastYearChartData}
          opacity={opacity}
          onLegendMouseEnter={handleLegendMouseEnter}
          onLegendMouseLeave={handleLegendMouseLeave}
        />
      )}

      <ReadingsTable
        readings={paginatedReadings}
        allReadingsCount={sortedReadings.length}
        supply={supply}
        datosGenerales={datosGenerales}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onEditReading={setReadingToEdit}
        onDeleteReading={setReadingToDelete}
      />
    </div>
  );
}

export const Component = SupplyDetailPage;
