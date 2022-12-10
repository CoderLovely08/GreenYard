$(document).ready(function () {
    var flag = false;
    $('#togglePassword').click(function () {
        $('#togglePassword').toggleClass('bi-eye-slash bi-eye');
        $('#newPassword,#userPassword').attr('type', function (index, attr) {
            flag = !flag;
            return flag == true ? 'text' : 'password';
        })
    });

    $('#postTitle').on('keyup', function () {
        var words = 0;
        if ((this.value.match(/\S+/g)) != null) {
            words = this.value.match(/\S+/g).length;
        }

        if (words > 200) {
            // Split the string on first 200 words and rejoin on spaces
            var trimmed = $(this).val().split(/\s+/, 200).join(" ");
            // Add a space at the end to make sure more typing creates new words
            $(this).val(trimmed + " ");
        }
        else {
            $('#display_count').text(words);
        }
    })
});
