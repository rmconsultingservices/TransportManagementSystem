using System.ComponentModel.DataAnnotations;

namespace TransportManagement.API.Models
{
    public class ChangePasswordRequest
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required]
        [MinLength(6, ErrorMessage = "La nueva contraseña debe tener al menos 6 caracteres.")]
        public string NewPassword { get; set; } = string.Empty;
    }

    public class AdminChangePasswordRequest
    {
        [Required]
        [MinLength(6, ErrorMessage = "La nueva contraseña debe tener al menos 6 caracteres.")]
        public string NewPassword { get; set; } = string.Empty;
    }
}
