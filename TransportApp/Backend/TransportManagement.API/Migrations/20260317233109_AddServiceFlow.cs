using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransportManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ServiceRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VehicleId = table.Column<int>(type: "int", nullable: true),
                    TrailerId = table.Column<int>(type: "int", nullable: true),
                    DateRequested = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DriverName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MechanicName = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ServiceRequests_Trailers_TrailerId",
                        column: x => x.TrailerId,
                        principalTable: "Trailers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ServiceRequests_Vehicles_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "Vehicles",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ServiceExecutions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ServiceRequestId = table.Column<int>(type: "int", nullable: false),
                    DiagnosisObservations = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FinalObservations = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MileageAtService = table.Column<double>(type: "float", nullable: true),
                    DateCompleted = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceExecutions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ServiceExecutions_ServiceRequests_ServiceRequestId",
                        column: x => x.ServiceRequestId,
                        principalTable: "ServiceRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ServiceExecutionSpareParts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ServiceExecutionId = table.Column<int>(type: "int", nullable: false),
                    SparePartId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceExecutionSpareParts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ServiceExecutionSpareParts_ServiceExecutions_ServiceExecutionId",
                        column: x => x.ServiceExecutionId,
                        principalTable: "ServiceExecutions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ServiceExecutionSpareParts_SpareParts_SparePartId",
                        column: x => x.SparePartId,
                        principalTable: "SpareParts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceExecutions_ServiceRequestId",
                table: "ServiceExecutions",
                column: "ServiceRequestId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ServiceExecutionSpareParts_ServiceExecutionId",
                table: "ServiceExecutionSpareParts",
                column: "ServiceExecutionId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceExecutionSpareParts_SparePartId",
                table: "ServiceExecutionSpareParts",
                column: "SparePartId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequests_TrailerId",
                table: "ServiceRequests",
                column: "TrailerId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequests_VehicleId",
                table: "ServiceRequests",
                column: "VehicleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ServiceExecutionSpareParts");

            migrationBuilder.DropTable(
                name: "ServiceExecutions");

            migrationBuilder.DropTable(
                name: "ServiceRequests");
        }
    }
}
