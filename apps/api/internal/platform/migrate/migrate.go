package migrate

import (
	"database/sql"
	"errors"
	"fmt"
	"path/filepath"

	_ "github.com/go-sql-driver/mysql"
	"github.com/golang-migrate/migrate/v4"
	migratemysql "github.com/golang-migrate/migrate/v4/database/mysql"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func Up(dsn, dir string) error {
	return run(dsn, dir, "up")
}

func Down(dsn, dir string) error {
	return run(dsn, dir, "down")
}

func run(dsn, dir, direction string) error {
	absDir, err := filepath.Abs(dir)
	if err != nil {
		return fmt.Errorf("resolve migrations dir: %w", err)
	}
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return fmt.Errorf("open mysql for migration: %w", err)
	}
	defer db.Close()

	driver, err := migratemysql.WithInstance(db, &migratemysql.Config{})
	if err != nil {
		return fmt.Errorf("create migration driver: %w", err)
	}
	m, err := migrate.NewWithDatabaseInstance("file://"+absDir, "mysql", driver)
	if err != nil {
		return fmt.Errorf("create migrator: %w", err)
	}

	switch direction {
	case "up":
		err = m.Up()
	case "down":
		err = m.Down()
	default:
		return fmt.Errorf("unknown migration direction %q", direction)
	}
	if errors.Is(err, migrate.ErrNoChange) {
		return nil
	}
	return err
}
