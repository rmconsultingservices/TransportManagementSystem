namespace TransportManagement.API.Services
{
    public interface ICurrentUserService
    {
        int? CompanyId { get; }
        string SystemUsername { get; }
        string ClientIp { get; }
        string UserAgent { get; }
    }
}
