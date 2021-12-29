use common::sense;
use Plack::Builder;
use Data::Dump qw(pp);

builder {
    enable_if(
        sub { $_[0]->{PATH_INFO} =~ /\.mjs$/ },
        sub {
            my ($app) = @_;
            return sub {
                my $ret     = $app->(@_);
                my $headers = $ret->[1];

                # replacing content type
                for ( my $i = 0 ; $i < @$headers ; $i += 2 ) {
                    if ( lc( $headers->[$i] ) eq 'content-type' ) {
                        $headers->[ $i + 1 ] = "application/javascript; charset=utf-8";
                    }
                }
                return $ret;
            };
        }
    );

    enable "Plack::Middleware::Static",
      path => qr{^.*},
      root => '.';
    sub {};
};

