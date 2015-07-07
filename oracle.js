var oracledb = require('oracledb');

oracledb.getConnection({
        user: "PSnavigator",
        password: "PSnavigat3",
        connectString: "205.125.100.51/PSPRODDB"
    },
    function(err, connection) {
        if (err) {
            console.error(err.message);
            return;
        }
        connection.execute(
            "SELECT first_name " + "FROM students " + "WHERE dcid = 21557",
            function(err, result) {
                if (err) {
                    console.error(err.message);
                    return;
                }
                console.log(result.rows);
            });
    });