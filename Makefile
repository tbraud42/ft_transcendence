ifeq ($(OS), Windows_NT)
	DIRSEP	= \\
	RM = rmdir /s /q
else
	DIRSEP	= /
	RM = rm -rf
endif

COMPOSE_FILE = docker-compose.yml

up:
	docker-compose -f $(COMPOSE_FILE) up -d

build:
	docker-compose -f $(COMPOSE_FILE) build

logs:
	docker-compose -f $(COMPOSE_FILE) logs -f

dev: build
	docker-compose -f $(COMPOSE_FILE) up

down:
	docker-compose -f $(COMPOSE_FILE) down

clean:
	docker-compose -f $(COMPOSE_FILE) down --volumes --remove-orphans
	$(RM) .$(DIRSEP)nginx$(DIRSEP)data

.PHONY: up build logs dev down clean