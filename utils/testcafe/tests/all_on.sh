ls *.ts.old | awk '{print "mv " $1 " $(echo " $1 " | sed \"s/.old//g\")"}' | bash
