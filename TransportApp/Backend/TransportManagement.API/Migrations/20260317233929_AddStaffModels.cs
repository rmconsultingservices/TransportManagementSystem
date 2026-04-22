using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransportManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddStaffModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DriverName",
                table: "ServiceRequests");

            migrationBuilder.DropColumn(
                name: "MechanicName",
                table: "ServiceRequests");

            migrationBuilder.AddColumn<int>(
                name: "DriverId",
                table: "ServiceRequests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MechanicId",
                table: "ServiceRequests",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Drivers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LicenseNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Drivers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Mechanics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Speciality = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Mechanics", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequests_DriverId",
                table: "ServiceRequests",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequests_MechanicId",
                table: "ServiceRequests",
                column: "MechanicId");

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceRequests_Drivers_DriverId",
                table: "ServiceRequests",
                column: "DriverId",
                principalTable: "Drivers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceRequests_Mechanics_MechanicId",
                table: "ServiceRequests",
                column: "MechanicId",
                principalTable: "Mechanics",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ServiceRequests_Drivers_DriverId",
                table: "ServiceRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_ServiceRequests_Mechanics_MechanicId",
                table: "ServiceRequests");

            migrationBuilder.DropTable(
                name: "Drivers");

            migrationBuilder.DropTable(
                name: "Mechanics");

            migrationBuilder.DropIndex(
                name: "IX_ServiceRequests_DriverId",
                table: "ServiceRequests");

            migrationBuilder.DropIndex(
                name: "IX_ServiceRequests_MechanicId",
                table: "ServiceRequests");

            migrationBuilder.DropColumn(
                name: "DriverId",
                table: "ServiceRequests");

            migrationBuilder.DropColumn(
                name: "MechanicId",
                table: "ServiceRequests");

            migrationBuilder.AddColumn<string>(
                name: "DriverName",
                table: "ServiceRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MechanicName",
                table: "ServiceRequests",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
