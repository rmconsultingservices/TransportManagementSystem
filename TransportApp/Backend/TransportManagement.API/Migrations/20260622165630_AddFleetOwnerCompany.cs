using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransportManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddFleetOwnerCompany : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OwnerCompany",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "OwnerCompany",
                table: "Trailers");

            migrationBuilder.AddColumn<int>(
                name: "FleetOwnerId",
                table: "Vehicles",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FleetOwnerId",
                table: "Trailers",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "FleetOwners",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FleetOwners", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FleetOwners_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_FleetOwnerId",
                table: "Vehicles",
                column: "FleetOwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Trailers_FleetOwnerId",
                table: "Trailers",
                column: "FleetOwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_FleetOwners_CompanyId",
                table: "FleetOwners",
                column: "CompanyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Trailers_FleetOwners_FleetOwnerId",
                table: "Trailers",
                column: "FleetOwnerId",
                principalTable: "FleetOwners",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Vehicles_FleetOwners_FleetOwnerId",
                table: "Vehicles",
                column: "FleetOwnerId",
                principalTable: "FleetOwners",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Trailers_FleetOwners_FleetOwnerId",
                table: "Trailers");

            migrationBuilder.DropForeignKey(
                name: "FK_Vehicles_FleetOwners_FleetOwnerId",
                table: "Vehicles");

            migrationBuilder.DropTable(
                name: "FleetOwners");

            migrationBuilder.DropIndex(
                name: "IX_Vehicles_FleetOwnerId",
                table: "Vehicles");

            migrationBuilder.DropIndex(
                name: "IX_Trailers_FleetOwnerId",
                table: "Trailers");

            migrationBuilder.DropColumn(
                name: "FleetOwnerId",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "FleetOwnerId",
                table: "Trailers");

            migrationBuilder.AddColumn<string>(
                name: "OwnerCompany",
                table: "Vehicles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OwnerCompany",
                table: "Trailers",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
