using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransportManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryAdjustmentsAndCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "SpareParts");

            migrationBuilder.AddColumn<int>(
                name: "CategoryId",
                table: "SpareParts",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "InventoryAdjustments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryAdjustments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InventoryAdjustments_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SparePartCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SparePartCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SparePartCategories_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "InventoryAdjustmentDetails",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InventoryAdjustmentId = table.Column<int>(type: "int", nullable: false),
                    SparePartId = table.Column<int>(type: "int", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    UnitCost = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalCost = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryAdjustmentDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InventoryAdjustmentDetails_InventoryAdjustments_InventoryAdjustmentId",
                        column: x => x.InventoryAdjustmentId,
                        principalTable: "InventoryAdjustments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_InventoryAdjustmentDetails_SpareParts_SparePartId",
                        column: x => x.SparePartId,
                        principalTable: "SpareParts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SpareParts_CategoryId",
                table: "SpareParts",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryAdjustmentDetails_InventoryAdjustmentId",
                table: "InventoryAdjustmentDetails",
                column: "InventoryAdjustmentId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryAdjustmentDetails_SparePartId",
                table: "InventoryAdjustmentDetails",
                column: "SparePartId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryAdjustments_CompanyId",
                table: "InventoryAdjustments",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_SparePartCategories_CompanyId",
                table: "SparePartCategories",
                column: "CompanyId");

            migrationBuilder.AddForeignKey(
                name: "FK_SpareParts_SparePartCategories_CategoryId",
                table: "SpareParts",
                column: "CategoryId",
                principalTable: "SparePartCategories",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SpareParts_SparePartCategories_CategoryId",
                table: "SpareParts");

            migrationBuilder.DropTable(
                name: "InventoryAdjustmentDetails");

            migrationBuilder.DropTable(
                name: "SparePartCategories");

            migrationBuilder.DropTable(
                name: "InventoryAdjustments");

            migrationBuilder.DropIndex(
                name: "IX_SpareParts_CategoryId",
                table: "SpareParts");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "SpareParts");

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "SpareParts",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
