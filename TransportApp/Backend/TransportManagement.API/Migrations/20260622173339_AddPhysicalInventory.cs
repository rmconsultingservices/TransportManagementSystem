using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransportManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPhysicalInventory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PhysicalInventories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    Number = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    WarehouseId = table.Column<int>(type: "int", nullable: false),
                    LocationId = table.Column<int>(type: "int", nullable: true),
                    DateStarted = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DateProcessed = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PhysicalInventories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PhysicalInventories_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PhysicalInventories_Locations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Locations",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PhysicalInventories_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PhysicalInventoryDetails",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PhysicalInventoryId = table.Column<int>(type: "int", nullable: false),
                    SparePartId = table.Column<int>(type: "int", nullable: false),
                    TheoreticalStock = table.Column<int>(type: "int", nullable: false),
                    RealStock = table.Column<int>(type: "int", nullable: false),
                    UnitCost = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PhysicalInventoryDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PhysicalInventoryDetails_PhysicalInventories_PhysicalInventoryId",
                        column: x => x.PhysicalInventoryId,
                        principalTable: "PhysicalInventories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PhysicalInventoryDetails_SpareParts_SparePartId",
                        column: x => x.SparePartId,
                        principalTable: "SpareParts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PhysicalInventories_CompanyId",
                table: "PhysicalInventories",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_PhysicalInventories_LocationId",
                table: "PhysicalInventories",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_PhysicalInventories_WarehouseId",
                table: "PhysicalInventories",
                column: "WarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_PhysicalInventoryDetails_PhysicalInventoryId",
                table: "PhysicalInventoryDetails",
                column: "PhysicalInventoryId");

            migrationBuilder.CreateIndex(
                name: "IX_PhysicalInventoryDetails_SparePartId",
                table: "PhysicalInventoryDetails",
                column: "SparePartId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PhysicalInventoryDetails");

            migrationBuilder.DropTable(
                name: "PhysicalInventories");
        }
    }
}
