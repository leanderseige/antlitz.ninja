<?php

/* not used yet */

		function decode_gzip( $data )
    {
        return gzinflate( substr( $data, 10, -8 ) );
    }

    if(isset($_GET['m'])) {
		$data = $_GET['m'];
       	$json = decode_gzip( utf8_decode( base64_decode($data) ) );
        if ( is_null( $json ) )
        {
            $json = json_decode( $data );
        }
        header('Content-Type: application/json');
        die($json);
    }
	die();
?>
