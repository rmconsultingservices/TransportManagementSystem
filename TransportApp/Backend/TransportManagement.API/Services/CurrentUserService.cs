using Microsoft.AspNetCore.Http;
using System.Linq;

namespace TransportManagement.API.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public int? CompanyId
        {
            get
            {
                var headers = _httpContextAccessor.HttpContext?.Request?.Headers;
                if (headers != null && headers.TryGetValue("X-Company-Id", out var companyIdVal))
                {
                    if (int.TryParse(companyIdVal.FirstOrDefault(), out int id))
                        return id;
                }
                return null;
            }
        }

        public string SystemUsername
        {
            get
            {
                var user = _httpContextAccessor.HttpContext?.User?.Identity?.Name;
                return !string.IsNullOrEmpty(user) ? user : "Anonymous";
            }
        }

        public string ClientIp
        {
            get
            {
                var ip = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString();
                return ip ?? "Unknown IP";
            }
        }

        public string UserAgent
        {
            get
            {
                var headers = _httpContextAccessor.HttpContext?.Request?.Headers;
                if (headers != null && headers.TryGetValue("User-Agent", out var ua))
                {
                    return ua.FirstOrDefault() ?? "Unknown Agent";
                }
                return "Unknown Agent";
            }
        }
    }
}
