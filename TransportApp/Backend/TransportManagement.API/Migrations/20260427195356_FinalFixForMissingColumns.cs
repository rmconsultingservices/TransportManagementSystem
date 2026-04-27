using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransportManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class FinalFixForMissingColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MaintenanceOrders_Vehicles_VehicleId",
                table: "MaintenanceOrders");

            migrationBuilder.AddColumn<double>(
                name: "LastMaintenanceMileage",
                table: "Vehicles",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "MaintenanceInterval",
                table: "Vehicles",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "LastMaintenanceMileage",
                table: "Trailers",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "MaintenanceInterval",
                table: "Trailers",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "LocationId",
                table: "SpareParts",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WarehouseId",
                table: "SpareParts",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "VehicleId",
                table: "MaintenanceOrders",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "ServiceRequestId",
                table: "MaintenanceOrders",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TrailerId",
                table: "MaintenanceOrders",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Warehouses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Warehouses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Warehouses_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Locations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    WarehouseId = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Locations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Locations_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Locations_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SpareParts_LocationId",
                table: "SpareParts",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_SpareParts_WarehouseId",
                table: "SpareParts",
                column: "WarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceOrders_TrailerId",
                table: "MaintenanceOrders",
                column: "TrailerId");

            migrationBuilder.CreateIndex(
                name: "IX_Locations_CompanyId",
                table: "Locations",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Locations_WarehouseId",
                table: "Locations",
                column: "WarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_Warehouses_CompanyId",
                table: "Warehouses",
                column: "CompanyId");

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceOrders_Trailers_TrailerId",
                table: "MaintenanceOrders",
                column: "TrailerId",
                principalTable: "Trailers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceOrders_Vehicles_VehicleId",
                table: "MaintenanceOrders",
                column: "VehicleId",
                principalTable: "Vehicles",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SpareParts_Locations_LocationId",
                table: "SpareParts",
                column: "LocationId",
                principalTable: "Locations",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SpareParts_Warehouses_WarehouseId",
                table: "SpareParts",
                column: "WarehouseId",
                principalTable: "Warehouses",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MaintenanceOrders_Trailers_TrailerId",
                table: "MaintenanceOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_MaintenanceOrders_Vehicles_VehicleId",
                table: "MaintenanceOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_SpareParts_Locations_LocationId",
                table: "SpareParts");

            migrationBuilder.DropForeignKey(
                name: "FK_SpareParts_Warehouses_WarehouseId",
                table: "SpareParts");

            migrationBuilder.DropTable(
                name: "Locations");

            migrationBuilder.DropTable(
                name: "Warehouses");

            migrationBuilder.DropIndex(
                name: "IX_SpareParts_LocationId",
                table: "SpareParts");

            migrationBuilder.DropIndex(
                name: "IX_SpareParts_WarehouseId",
                table: "SpareParts");

            migrationBuilder.DropIndex(
                name: "IX_MaintenanceOrders_TrailerId",
                table: "MaintenanceOrders");

            migrationBuilder.DropColumn(
                name: "LastMaintenanceMileage",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "MaintenanceInterval",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "LastMaintenanceMileage",
                table: "Trailers");

            migrationBuilder.DropColumn(
                name: "MaintenanceInterval",
                table: "Trailers");

            migrationBuilder.DropColumn(
                name: "LocationId",
                table: "SpareParts");

            migrationBuilder.DropColumn(
                name: "WarehouseId",
                table: "SpareParts");

            migrationBuilder.DropColumn(
                name: "ServiceRequestId",
                table: "MaintenanceOrders");

            migrationBuilder.DropColumn(
                name: "TrailerId",
                table: "MaintenanceOrders");

            migrationBuilder.AlterColumn<int>(
                name: "VehicleId",
                table: "MaintenanceOrders",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceOrders_Vehicles_VehicleId",
                table: "MaintenanceOrders",
                column: "VehicleId",
                principalTable: "Vehicles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
