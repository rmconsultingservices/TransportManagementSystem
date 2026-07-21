using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransportManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUnitOfMeasureToTransactions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UnitOfMeasureId",
                table: "ServiceExecutionSpareParts",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UnitOfMeasureId",
                table: "Quotations",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UnitOfMeasureId",
                table: "PurchaseRequisitions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UnitOfMeasureId",
                table: "PurchaseOrderDetails",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UnitOfMeasureId",
                table: "PurchaseInvoiceDetails",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UnitOfMeasureId",
                table: "PhysicalInventoryDetails",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UnitOfMeasureId",
                table: "InventoryAdjustmentDetails",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ServiceExecutionSpareParts_UnitOfMeasureId",
                table: "ServiceExecutionSpareParts",
                column: "UnitOfMeasureId");

            migrationBuilder.CreateIndex(
                name: "IX_Quotations_UnitOfMeasureId",
                table: "Quotations",
                column: "UnitOfMeasureId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequisitions_UnitOfMeasureId",
                table: "PurchaseRequisitions",
                column: "UnitOfMeasureId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderDetails_UnitOfMeasureId",
                table: "PurchaseOrderDetails",
                column: "UnitOfMeasureId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseInvoiceDetails_UnitOfMeasureId",
                table: "PurchaseInvoiceDetails",
                column: "UnitOfMeasureId");

            migrationBuilder.CreateIndex(
                name: "IX_PhysicalInventoryDetails_UnitOfMeasureId",
                table: "PhysicalInventoryDetails",
                column: "UnitOfMeasureId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryAdjustmentDetails_UnitOfMeasureId",
                table: "InventoryAdjustmentDetails",
                column: "UnitOfMeasureId");

            migrationBuilder.AddForeignKey(
                name: "FK_InventoryAdjustmentDetails_UnitsOfMeasure_UnitOfMeasureId",
                table: "InventoryAdjustmentDetails",
                column: "UnitOfMeasureId",
                principalTable: "UnitsOfMeasure",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PhysicalInventoryDetails_UnitsOfMeasure_UnitOfMeasureId",
                table: "PhysicalInventoryDetails",
                column: "UnitOfMeasureId",
                principalTable: "UnitsOfMeasure",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseInvoiceDetails_UnitsOfMeasure_UnitOfMeasureId",
                table: "PurchaseInvoiceDetails",
                column: "UnitOfMeasureId",
                principalTable: "UnitsOfMeasure",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderDetails_UnitsOfMeasure_UnitOfMeasureId",
                table: "PurchaseOrderDetails",
                column: "UnitOfMeasureId",
                principalTable: "UnitsOfMeasure",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseRequisitions_UnitsOfMeasure_UnitOfMeasureId",
                table: "PurchaseRequisitions",
                column: "UnitOfMeasureId",
                principalTable: "UnitsOfMeasure",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Quotations_UnitsOfMeasure_UnitOfMeasureId",
                table: "Quotations",
                column: "UnitOfMeasureId",
                principalTable: "UnitsOfMeasure",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceExecutionSpareParts_UnitsOfMeasure_UnitOfMeasureId",
                table: "ServiceExecutionSpareParts",
                column: "UnitOfMeasureId",
                principalTable: "UnitsOfMeasure",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InventoryAdjustmentDetails_UnitsOfMeasure_UnitOfMeasureId",
                table: "InventoryAdjustmentDetails");

            migrationBuilder.DropForeignKey(
                name: "FK_PhysicalInventoryDetails_UnitsOfMeasure_UnitOfMeasureId",
                table: "PhysicalInventoryDetails");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseInvoiceDetails_UnitsOfMeasure_UnitOfMeasureId",
                table: "PurchaseInvoiceDetails");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderDetails_UnitsOfMeasure_UnitOfMeasureId",
                table: "PurchaseOrderDetails");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseRequisitions_UnitsOfMeasure_UnitOfMeasureId",
                table: "PurchaseRequisitions");

            migrationBuilder.DropForeignKey(
                name: "FK_Quotations_UnitsOfMeasure_UnitOfMeasureId",
                table: "Quotations");

            migrationBuilder.DropForeignKey(
                name: "FK_ServiceExecutionSpareParts_UnitsOfMeasure_UnitOfMeasureId",
                table: "ServiceExecutionSpareParts");

            migrationBuilder.DropIndex(
                name: "IX_ServiceExecutionSpareParts_UnitOfMeasureId",
                table: "ServiceExecutionSpareParts");

            migrationBuilder.DropIndex(
                name: "IX_Quotations_UnitOfMeasureId",
                table: "Quotations");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseRequisitions_UnitOfMeasureId",
                table: "PurchaseRequisitions");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrderDetails_UnitOfMeasureId",
                table: "PurchaseOrderDetails");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseInvoiceDetails_UnitOfMeasureId",
                table: "PurchaseInvoiceDetails");

            migrationBuilder.DropIndex(
                name: "IX_PhysicalInventoryDetails_UnitOfMeasureId",
                table: "PhysicalInventoryDetails");

            migrationBuilder.DropIndex(
                name: "IX_InventoryAdjustmentDetails_UnitOfMeasureId",
                table: "InventoryAdjustmentDetails");

            migrationBuilder.DropColumn(
                name: "UnitOfMeasureId",
                table: "ServiceExecutionSpareParts");

            migrationBuilder.DropColumn(
                name: "UnitOfMeasureId",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "UnitOfMeasureId",
                table: "PurchaseRequisitions");

            migrationBuilder.DropColumn(
                name: "UnitOfMeasureId",
                table: "PurchaseOrderDetails");

            migrationBuilder.DropColumn(
                name: "UnitOfMeasureId",
                table: "PurchaseInvoiceDetails");

            migrationBuilder.DropColumn(
                name: "UnitOfMeasureId",
                table: "PhysicalInventoryDetails");

            migrationBuilder.DropColumn(
                name: "UnitOfMeasureId",
                table: "InventoryAdjustmentDetails");
        }
    }
}
