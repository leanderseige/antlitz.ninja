<?php

/*

  ANTLITZ.NINJA

  (c) 2018, Leander Seige, leander@seige.name

	https://antlitz.ninja
	https://github.com/leanderseige/antlitz.ninja

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.

*/

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
