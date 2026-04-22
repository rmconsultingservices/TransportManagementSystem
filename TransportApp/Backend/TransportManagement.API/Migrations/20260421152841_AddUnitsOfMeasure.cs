using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransportManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUnitsOfMeasure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UnitOfMeasure",
                table: "SpareParts");

            migrationBuilder.AddColumn<int>(
                name: "UnitOfMeasureId",
                table: "SpareParts",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "UnitsOfMeasure",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Abbreviation = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnitsOfMeasure", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UnitsOfMeasure_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SpareParts_UnitOfMeasureId",
                table: "SpareParts",
                column: "UnitOfMeasureId");

            migrationBuilder.CreateIndex(
                name: "IX_UnitsOfMeasure_CompanyId",
                table: "UnitsOfMeasure",
                column: "CompanyId");

            migrationBuilder.AddForeignKey(
                name: "FK_SpareParts_UnitsOfMeasure_UnitOfMeasureId",
                table: "SpareParts",
                column: "UnitOfMeasureId",
                principalTable: "UnitsOfMeasure",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SpareParts_UnitsOfMeasure_UnitOfMeasureId",
                table: "SpareParts");

            migrationBuilder.DropTable(
                name: "UnitsOfMeasure");

            migrationBuilder.DropIndex(
                name: "IX_SpareParts_UnitOfMeasureId",
                table: "SpareParts");

            migrationBuilder.DropColumn(
                name: "UnitOfMeasureId",
                table: "SpareParts");

            migrationBuilder.AddColumn<string>(
                name: "UnitOfMeasure",
                table: "SpareParts",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
