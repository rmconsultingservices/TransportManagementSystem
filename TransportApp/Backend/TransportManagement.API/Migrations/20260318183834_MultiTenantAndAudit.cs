using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransportManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class MultiTenantAndAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Vehicles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Trailers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Suppliers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "SpareParts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "ServiceRequests",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "ServiceLogs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "ServiceExecutionSpareParts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "ServiceExecutions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Quotations",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "PurchaseRequisitions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "PurchaseOrders",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "PurchaseOrderDetails",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "PurchaseInvoices",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "PurchaseInvoiceDetails",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Mechanics",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "MaintenanceOrders",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Drivers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    TableName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RecordId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    OldValues = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NewValues = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SystemUsername = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    WindowsUsername = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MachineName = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Companies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Rif = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Companies", x => x.Id);
                });

            migrationBuilder.Sql("SET IDENTITY_INSERT Companies ON; INSERT INTO Companies (Id, Name, Rif, Address, IsActive) VALUES (0, 'Default Company', 'J-0000000', 'N/A', 1); SET IDENTITY_INSERT Companies OFF;");

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Username = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsSuperAdmin = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserCompanies",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false),
                    CompanyId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserCompanies", x => new { x.UserId, x.CompanyId });
                    table.ForeignKey(
                        name: "FK_UserCompanies_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserCompanies_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_CompanyId",
                table: "Vehicles",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Trailers_CompanyId",
                table: "Trailers",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Suppliers_CompanyId",
                table: "Suppliers",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_SpareParts_CompanyId",
                table: "SpareParts",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequests_CompanyId",
                table: "ServiceRequests",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceLogs_CompanyId",
                table: "ServiceLogs",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceExecutionSpareParts_CompanyId",
                table: "ServiceExecutionSpareParts",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceExecutions_CompanyId",
                table: "ServiceExecutions",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Quotations_CompanyId",
                table: "Quotations",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequisitions_CompanyId",
                table: "PurchaseRequisitions",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_CompanyId",
                table: "PurchaseOrders",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderDetails_CompanyId",
                table: "PurchaseOrderDetails",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseInvoices_CompanyId",
                table: "PurchaseInvoices",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseInvoiceDetails_CompanyId",
                table: "PurchaseInvoiceDetails",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Mechanics_CompanyId",
                table: "Mechanics",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceOrders_CompanyId",
                table: "MaintenanceOrders",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Drivers_CompanyId",
                table: "Drivers",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_UserCompanies_CompanyId",
                table: "UserCompanies",
                column: "CompanyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Drivers_Companies_CompanyId",
                table: "Drivers",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceOrders_Companies_CompanyId",
                table: "MaintenanceOrders",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Mechanics_Companies_CompanyId",
                table: "Mechanics",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseInvoiceDetails_Companies_CompanyId",
                table: "PurchaseInvoiceDetails",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseInvoices_Companies_CompanyId",
                table: "PurchaseInvoices",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderDetails_Companies_CompanyId",
                table: "PurchaseOrderDetails",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrders_Companies_CompanyId",
                table: "PurchaseOrders",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseRequisitions_Companies_CompanyId",
                table: "PurchaseRequisitions",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Quotations_Companies_CompanyId",
                table: "Quotations",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceExecutions_Companies_CompanyId",
                table: "ServiceExecutions",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceExecutionSpareParts_Companies_CompanyId",
                table: "ServiceExecutionSpareParts",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceLogs_Companies_CompanyId",
                table: "ServiceLogs",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceRequests_Companies_CompanyId",
                table: "ServiceRequests",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SpareParts_Companies_CompanyId",
                table: "SpareParts",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Suppliers_Companies_CompanyId",
                table: "Suppliers",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Trailers_Companies_CompanyId",
                table: "Trailers",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Vehicles_Companies_CompanyId",
                table: "Vehicles",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Drivers_Companies_CompanyId",
                table: "Drivers");

            migrationBuilder.DropForeignKey(
                name: "FK_MaintenanceOrders_Companies_CompanyId",
                table: "MaintenanceOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_Mechanics_Companies_CompanyId",
                table: "Mechanics");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseInvoiceDetails_Companies_CompanyId",
                table: "PurchaseInvoiceDetails");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseInvoices_Companies_CompanyId",
                table: "PurchaseInvoices");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderDetails_Companies_CompanyId",
                table: "PurchaseOrderDetails");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrders_Companies_CompanyId",
                table: "PurchaseOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseRequisitions_Companies_CompanyId",
                table: "PurchaseRequisitions");

            migrationBuilder.DropForeignKey(
                name: "FK_Quotations_Companies_CompanyId",
                table: "Quotations");

            migrationBuilder.DropForeignKey(
                name: "FK_ServiceExecutions_Companies_CompanyId",
                table: "ServiceExecutions");

            migrationBuilder.DropForeignKey(
                name: "FK_ServiceExecutionSpareParts_Companies_CompanyId",
                table: "ServiceExecutionSpareParts");

            migrationBuilder.DropForeignKey(
                name: "FK_ServiceLogs_Companies_CompanyId",
                table: "ServiceLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_ServiceRequests_Companies_CompanyId",
                table: "ServiceRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_SpareParts_Companies_CompanyId",
                table: "SpareParts");

            migrationBuilder.DropForeignKey(
                name: "FK_Suppliers_Companies_CompanyId",
                table: "Suppliers");

            migrationBuilder.DropForeignKey(
                name: "FK_Trailers_Companies_CompanyId",
                table: "Trailers");

            migrationBuilder.DropForeignKey(
                name: "FK_Vehicles_Companies_CompanyId",
                table: "Vehicles");

            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "UserCompanies");

            migrationBuilder.DropTable(
                name: "Companies");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Vehicles_CompanyId",
                table: "Vehicles");

            migrationBuilder.DropIndex(
                name: "IX_Trailers_CompanyId",
                table: "Trailers");

            migrationBuilder.DropIndex(
                name: "IX_Suppliers_CompanyId",
                table: "Suppliers");

            migrationBuilder.DropIndex(
                name: "IX_SpareParts_CompanyId",
                table: "SpareParts");

            migrationBuilder.DropIndex(
                name: "IX_ServiceRequests_CompanyId",
                table: "ServiceRequests");

            migrationBuilder.DropIndex(
                name: "IX_ServiceLogs_CompanyId",
                table: "ServiceLogs");

            migrationBuilder.DropIndex(
                name: "IX_ServiceExecutionSpareParts_CompanyId",
                table: "ServiceExecutionSpareParts");

            migrationBuilder.DropIndex(
                name: "IX_ServiceExecutions_CompanyId",
                table: "ServiceExecutions");

            migrationBuilder.DropIndex(
                name: "IX_Quotations_CompanyId",
                table: "Quotations");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseRequisitions_CompanyId",
                table: "PurchaseRequisitions");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrders_CompanyId",
                table: "PurchaseOrders");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrderDetails_CompanyId",
                table: "PurchaseOrderDetails");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseInvoices_CompanyId",
                table: "PurchaseInvoices");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseInvoiceDetails_CompanyId",
                table: "PurchaseInvoiceDetails");

            migrationBuilder.DropIndex(
                name: "IX_Mechanics_CompanyId",
                table: "Mechanics");

            migrationBuilder.DropIndex(
                name: "IX_MaintenanceOrders_CompanyId",
                table: "MaintenanceOrders");

            migrationBuilder.DropIndex(
                name: "IX_Drivers_CompanyId",
                table: "Drivers");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Trailers");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "SpareParts");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "ServiceRequests");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "ServiceLogs");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "ServiceExecutionSpareParts");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "ServiceExecutions");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "PurchaseRequisitions");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "PurchaseOrderDetails");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "PurchaseInvoices");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "PurchaseInvoiceDetails");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Mechanics");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "MaintenanceOrders");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Drivers");
        }
    }
}
