ifeq ($(OS), Windows_NT)
	DIRSEP	= \\
	RM = rmdir /s /q
else
	DIRSEP	= /
	RM = rm -rf
endif

COMPOSE_FILE = docker-compose.yml
DEV_OVERRIDE = docker-compose.override.yml

up:
	docker-compose -f $(COMPOSE_FILE) up --build -d


build:
	docker compose -f $(COMPOSE_FILE) build --no-cache

logs:
	docker compose -f $(COMPOSE_FILE) logs -f

dev:
	docker-compose -f $(COMPOSE_FILE) -f $(DEV_OVERRIDE) up --build

down:
	docker compose -f $(COMPOSE_FILE) down

clean:
	docker-compose -f $(COMPOSE_FILE) down --volumes --remove-orphans
	$(RM) .$(DIRSEP)nginx$(DIRSEP)data
	$(RM) .$(DIRSEP)web$(DIRSEP)dist

.PHONY: up build logs dev down clean
