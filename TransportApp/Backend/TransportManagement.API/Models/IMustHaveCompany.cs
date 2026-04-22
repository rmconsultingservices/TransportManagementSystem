namespace TransportManagement.API.Models
{
    public interface IMustHaveCompany
    {
        int CompanyId { get; set; }
        Company? Company { get; set; }
    }
}
