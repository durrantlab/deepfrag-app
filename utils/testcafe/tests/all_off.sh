ls *.ts | awk '{print "mv " $1 " " $1 ".old"}' | bash
