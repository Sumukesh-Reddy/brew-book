
    create table academic_records (
        year_of_passing integer,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        additional_notes varchar(255),
        degree varchar(255) not null,
        grade_or_percentage varchar(255),
        institution varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table user_details (
        date_of_birth date,
        email_verified bit not null,
        is_primary bit,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_id bigint,
        city varchar(255),
        country varchar(255),
        first_name varchar(255),
        last_name varchar(255),
        password_reset_token varchar(255),
        pincode varchar(255),
        plot_number varchar(255),
        street_address varchar(255),
        verification_token varchar(255),
        gender enum ('MALE','FEMALE','OTHER'),
        primary key (id)
    ) engine=InnoDB;

    create table users (
        active bit not null,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        email varchar(255) not null,
        name varchar(255) not null,
        password varchar(255) not null,
        role varchar(255),
        primary key (id)
    ) engine=InnoDB;

    create table work_experiences (
        currently_working_here bit not null,
        end_date date,
        start_date date,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        achievements varchar(255),
        company_name varchar(255) not null,
        job_description varchar(255),
        job_title varchar(255) not null,
        skills_gained varchar(255),
        primary key (id)
    ) engine=InnoDB;

    alter table user_details 
       add constraint UK_f4pdcamta635qqbhgcyqvrg7f unique (user_id);

    alter table users 
       add constraint UK_6dotkott2kjsp8vw4d0m25fb7 unique (email);

    alter table academic_records 
       add constraint FKocx43cq4vipble6ryyyha7xhq 
       foreign key (user_detail_id) 
       references user_details (id);

    alter table user_details 
       add constraint FKicouhgavvmiiohc28mgk0kuj5 
       foreign key (user_id) 
       references users (id);

    alter table work_experiences 
       add constraint FK8panc3p0vbu8qs1gvnouf7gt3 
       foreign key (user_detail_id) 
       references user_details (id);

    create table academic_records (
        year_of_passing integer,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        additional_notes varchar(255),
        degree varchar(255) not null,
        grade_or_percentage varchar(255),
        institution varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table user_details (
        date_of_birth date,
        email_verified bit not null,
        is_primary bit,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_id bigint,
        city varchar(255),
        country varchar(255),
        first_name varchar(255),
        last_name varchar(255),
        password_reset_token varchar(255),
        pincode varchar(255),
        plot_number varchar(255),
        street_address varchar(255),
        verification_token varchar(255),
        gender enum ('MALE','FEMALE','OTHER'),
        primary key (id)
    ) engine=InnoDB;

    create table users (
        active bit not null,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        email varchar(255) not null,
        name varchar(255) not null,
        password varchar(255) not null,
        role varchar(255),
        primary key (id)
    ) engine=InnoDB;

    create table work_experiences (
        currently_working_here bit not null,
        end_date date,
        start_date date,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        achievements varchar(255),
        company_name varchar(255) not null,
        job_description varchar(255),
        job_title varchar(255) not null,
        skills_gained varchar(255),
        primary key (id)
    ) engine=InnoDB;

    alter table user_details 
       add constraint UK_f4pdcamta635qqbhgcyqvrg7f unique (user_id);

    alter table users 
       add constraint UK_6dotkott2kjsp8vw4d0m25fb7 unique (email);

    alter table academic_records 
       add constraint FKocx43cq4vipble6ryyyha7xhq 
       foreign key (user_detail_id) 
       references user_details (id);

    alter table user_details 
       add constraint FKicouhgavvmiiohc28mgk0kuj5 
       foreign key (user_id) 
       references users (id);

    alter table work_experiences 
       add constraint FK8panc3p0vbu8qs1gvnouf7gt3 
       foreign key (user_detail_id) 
       references user_details (id);

    create table academic_records (
        year_of_passing integer,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        additional_notes varchar(255),
        degree varchar(255) not null,
        grade_or_percentage varchar(255),
        institution varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table user_details (
        date_of_birth date,
        email_verified bit not null,
        is_primary bit,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_id bigint,
        city varchar(255),
        country varchar(255),
        first_name varchar(255),
        last_name varchar(255),
        password_reset_token varchar(255),
        pincode varchar(255),
        plot_number varchar(255),
        street_address varchar(255),
        verification_token varchar(255),
        gender enum ('MALE','FEMALE','OTHER'),
        primary key (id)
    ) engine=InnoDB;

    create table users (
        active bit not null,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        email varchar(255) not null,
        name varchar(255) not null,
        password varchar(255) not null,
        role varchar(255),
        primary key (id)
    ) engine=InnoDB;

    create table work_experiences (
        currently_working_here bit not null,
        end_date date,
        start_date date,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        achievements varchar(255),
        company_name varchar(255) not null,
        job_description varchar(255),
        job_title varchar(255) not null,
        skills_gained varchar(255),
        primary key (id)
    ) engine=InnoDB;

    alter table user_details 
       add constraint UK_f4pdcamta635qqbhgcyqvrg7f unique (user_id);

    alter table users 
       add constraint UK_6dotkott2kjsp8vw4d0m25fb7 unique (email);

    alter table academic_records 
       add constraint FKocx43cq4vipble6ryyyha7xhq 
       foreign key (user_detail_id) 
       references user_details (id);

    alter table user_details 
       add constraint FKicouhgavvmiiohc28mgk0kuj5 
       foreign key (user_id) 
       references users (id);

    alter table work_experiences 
       add constraint FK8panc3p0vbu8qs1gvnouf7gt3 
       foreign key (user_detail_id) 
       references user_details (id);

    create table academic_records (
        year_of_passing integer,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        additional_notes varchar(255),
        degree varchar(255) not null,
        grade_or_percentage varchar(255),
        institution varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table government_documents (
        created_at datetime(6),
        file_size bigint,
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        document_type varchar(255) not null,
        file_name varchar(255) not null,
        file_type varchar(255),
        file_data LONGTEXT,
        primary key (id)
    ) engine=InnoDB;

    create table user_details (
        date_of_birth date,
        email_verified bit not null,
        is_primary bit,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_id bigint,
        city varchar(255),
        country varchar(255),
        first_name varchar(255),
        last_name varchar(255),
        password_reset_token varchar(255),
        pincode varchar(255),
        plot_number varchar(255),
        street_address varchar(255),
        verification_token varchar(255),
        gender enum ('MALE','FEMALE','OTHER'),
        primary key (id)
    ) engine=InnoDB;

    create table users (
        active bit not null,
        password_change_required bit not null,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        email varchar(255) not null,
        name varchar(255) not null,
        password varchar(255) not null,
        role varchar(255),
        primary key (id)
    ) engine=InnoDB;

    create table work_experiences (
        currently_working_here bit not null,
        end_date date,
        start_date date,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        achievements varchar(255),
        company_name varchar(255) not null,
        job_description varchar(255),
        job_title varchar(255) not null,
        skills_gained varchar(255),
        primary key (id)
    ) engine=InnoDB;

    alter table user_details 
       add constraint UK_f4pdcamta635qqbhgcyqvrg7f unique (user_id);

    alter table users 
       add constraint UK_6dotkott2kjsp8vw4d0m25fb7 unique (email);

    alter table academic_records 
       add constraint FKocx43cq4vipble6ryyyha7xhq 
       foreign key (user_detail_id) 
       references user_details (id);

    alter table government_documents 
       add constraint FKpqb6cu77ru9y3mueek32nnpxk 
       foreign key (user_detail_id) 
       references user_details (id);

    alter table user_details 
       add constraint FKicouhgavvmiiohc28mgk0kuj5 
       foreign key (user_id) 
       references users (id);

    alter table work_experiences 
       add constraint FK8panc3p0vbu8qs1gvnouf7gt3 
       foreign key (user_detail_id) 
       references user_details (id);

    create table academic_records (
        year_of_passing integer,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        additional_notes varchar(255),
        degree varchar(255) not null,
        grade_or_percentage varchar(255),
        institution varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table government_documents (
        created_at datetime(6),
        file_size bigint,
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        document_type varchar(255) not null,
        file_name varchar(255) not null,
        file_type varchar(255),
        file_data LONGTEXT,
        primary key (id)
    ) engine=InnoDB;

    create table user_details (
        date_of_birth date,
        email_verified bit not null,
        is_primary bit,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_id bigint,
        city varchar(255),
        country varchar(255),
        first_name varchar(255),
        last_name varchar(255),
        password_reset_token varchar(255),
        pincode varchar(255),
        plot_number varchar(255),
        street_address varchar(255),
        verification_token varchar(255),
        gender enum ('MALE','FEMALE','OTHER'),
        primary key (id)
    ) engine=InnoDB;

    create table users (
        active bit not null,
        password_change_required bit not null,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        email varchar(255) not null,
        name varchar(255) not null,
        password varchar(255) not null,
        role varchar(255),
        primary key (id)
    ) engine=InnoDB;

    create table work_experiences (
        currently_working_here bit not null,
        end_date date,
        start_date date,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        achievements varchar(255),
        company_name varchar(255) not null,
        job_description varchar(255),
        job_title varchar(255) not null,
        skills_gained varchar(255),
        primary key (id)
    ) engine=InnoDB;

    alter table user_details 
       add constraint UK_f4pdcamta635qqbhgcyqvrg7f unique (user_id);

    alter table users 
       add constraint UK_6dotkott2kjsp8vw4d0m25fb7 unique (email);

    alter table academic_records 
       add constraint FKocx43cq4vipble6ryyyha7xhq 
       foreign key (user_detail_id) 
       references user_details (id);

    alter table government_documents 
       add constraint FKpqb6cu77ru9y3mueek32nnpxk 
       foreign key (user_detail_id) 
       references user_details (id);

    alter table user_details 
       add constraint FKicouhgavvmiiohc28mgk0kuj5 
       foreign key (user_id) 
       references users (id);

    alter table work_experiences 
       add constraint FK8panc3p0vbu8qs1gvnouf7gt3 
       foreign key (user_detail_id) 
       references user_details (id);

    create table academic_records (
        year_of_passing integer,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        additional_notes varchar(255),
        degree varchar(255) not null,
        grade_or_percentage varchar(255),
        institution varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table government_documents (
        created_at datetime(6),
        file_size bigint,
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        document_type varchar(255) not null,
        file_name varchar(255) not null,
        file_type varchar(255),
        file_data LONGTEXT,
        primary key (id)
    ) engine=InnoDB;

    create table user_details (
        date_of_birth date,
        email_verified bit not null,
        is_primary bit,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_id bigint,
        city varchar(255),
        country varchar(255),
        first_name varchar(255),
        last_name varchar(255),
        password_reset_token varchar(255),
        pincode varchar(255),
        plot_number varchar(255),
        street_address varchar(255),
        verification_token varchar(255),
        gender enum ('MALE','FEMALE','OTHER'),
        primary key (id)
    ) engine=InnoDB;

    create table users (
        active bit not null,
        password_change_required bit not null,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        email varchar(255) not null,
        name varchar(255) not null,
        password varchar(255) not null,
        role varchar(255),
        primary key (id)
    ) engine=InnoDB;

    create table work_experiences (
        currently_working_here bit not null,
        end_date date,
        start_date date,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        achievements varchar(255),
        company_name varchar(255) not null,
        job_description varchar(255),
        job_title varchar(255) not null,
        skills_gained varchar(255),
        primary key (id)
    ) engine=InnoDB;

    alter table user_details 
       add constraint UK_f4pdcamta635qqbhgcyqvrg7f unique (user_id);

    alter table users 
       add constraint UK_6dotkott2kjsp8vw4d0m25fb7 unique (email);

    alter table academic_records 
       add constraint FKocx43cq4vipble6ryyyha7xhq 
       foreign key (user_detail_id) 
       references user_details (id);

    alter table government_documents 
       add constraint FKpqb6cu77ru9y3mueek32nnpxk 
       foreign key (user_detail_id) 
       references user_details (id);

    alter table user_details 
       add constraint FKicouhgavvmiiohc28mgk0kuj5 
       foreign key (user_id) 
       references users (id);

    alter table work_experiences 
       add constraint FK8panc3p0vbu8qs1gvnouf7gt3 
       foreign key (user_detail_id) 
       references user_details (id);

    create table academic_records (
        year_of_passing integer,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        additional_notes varchar(255),
        degree varchar(255) not null,
        grade_or_percentage varchar(255),
        institution varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table government_documents (
        created_at datetime(6),
        file_size bigint,
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        document_type varchar(255) not null,
        file_name varchar(255) not null,
        file_type varchar(255),
        file_data LONGTEXT,
        primary key (id)
    ) engine=InnoDB;

    create table user_details (
        date_of_birth date,
        email_verified bit not null,
        is_primary bit,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_id bigint,
        city varchar(255),
        country varchar(255),
        first_name varchar(255),
        last_name varchar(255),
        password_reset_token varchar(255),
        pincode varchar(255),
        plot_number varchar(255),
        street_address varchar(255),
        verification_token varchar(255),
        gender enum ('MALE','FEMALE','OTHER'),
        primary key (id)
    ) engine=InnoDB;

    create table users (
        active bit not null,
        password_change_required bit not null,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        email varchar(255) not null,
        name varchar(255) not null,
        password varchar(255) not null,
        role varchar(255),
        primary key (id)
    ) engine=InnoDB;

    create table work_experiences (
        currently_working_here bit not null,
        end_date date,
        start_date date,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        achievements varchar(255),
        company_name varchar(255) not null,
        job_description varchar(255),
        job_title varchar(255) not null,
        skills_gained varchar(255),
        primary key (id)
    ) engine=InnoDB;

    alter table user_details 
       add constraint UK_f4pdcamta635qqbhgcyqvrg7f unique (user_id);

    alter table users 
       add constraint UK_6dotkott2kjsp8vw4d0m25fb7 unique (email);

    alter table academic_records 
       add constraint FKocx43cq4vipble6ryyyha7xhq 
       foreign key (user_detail_id) 
       references user_details (id);

    alter table government_documents 
       add constraint FKpqb6cu77ru9y3mueek32nnpxk 
       foreign key (user_detail_id) 
       references user_details (id);

    alter table user_details 
       add constraint FKicouhgavvmiiohc28mgk0kuj5 
       foreign key (user_id) 
       references users (id);

    alter table work_experiences 
       add constraint FK8panc3p0vbu8qs1gvnouf7gt3 
       foreign key (user_detail_id) 
       references user_details (id);

    create table academic_records (
        year_of_passing integer,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        additional_notes varchar(255),
        degree varchar(255) not null,
        grade_or_percentage varchar(255),
        institution varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table government_documents (
        created_at datetime(6),
        file_size bigint,
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        document_type varchar(255) not null,
        file_name varchar(255) not null,
        file_type varchar(255),
        file_data LONGTEXT,
        primary key (id)
    ) engine=InnoDB;

    create table user_details (
        date_of_birth date,
        email_verified bit not null,
        is_primary bit,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_id bigint,
        city varchar(255),
        country varchar(255),
        first_name varchar(255),
        last_name varchar(255),
        password_reset_token varchar(255),
        pincode varchar(255),
        plot_number varchar(255),
        street_address varchar(255),
        verification_token varchar(255),
        gender enum ('MALE','FEMALE','OTHER'),
        primary key (id)
    ) engine=InnoDB;

    create table users (
        active bit not null,
        password_change_required bit not null,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        email varchar(255) not null,
        name varchar(255) not null,
        password varchar(255) not null,
        role varchar(255),
        primary key (id)
    ) engine=InnoDB;

    create table work_experiences (
        currently_working_here bit not null,
        end_date date,
        start_date date,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        achievements varchar(255),
        company_name varchar(255) not null,
        job_description varchar(255),
        job_title varchar(255) not null,
        skills_gained varchar(255),
        primary key (id)
    ) engine=InnoDB;

    alter table user_details 
       add constraint UK_f4pdcamta635qqbhgcyqvrg7f unique (user_id);

    alter table users 
       add constraint UK_6dotkott2kjsp8vw4d0m25fb7 unique (email);

    alter table academic_records 
       add constraint FKocx43cq4vipble6ryyyha7xhq 
       foreign key (user_detail_id) 
       references user_details (id);

    alter table government_documents 
       add constraint FKpqb6cu77ru9y3mueek32nnpxk 
       foreign key (user_detail_id) 
       references user_details (id);

    alter table user_details 
       add constraint FKicouhgavvmiiohc28mgk0kuj5 
       foreign key (user_id) 
       references users (id);

    alter table work_experiences 
       add constraint FK8panc3p0vbu8qs1gvnouf7gt3 
       foreign key (user_detail_id) 
       references user_details (id);
   -- Add password_change_required column to users table
   ALTER TABLE users 
   ADD COLUMN password_change_required BIT NOT NULL DEFAULT 0;

   -- Create government_documents table if it doesn't exist
   CREATE TABLE IF NOT EXISTS government_documents (
      id BIGINT NOT NULL AUTO_INCREMENT,
      created_at DATETIME(6),
      file_size BIGINT,
      updated_at DATETIME(6),
      user_detail_id BIGINT,
      document_type VARCHAR(255) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_type VARCHAR(255),
      file_data LONGTEXT,
      PRIMARY KEY (id),
      CONSTRAINT FKpqb6cu77ru9y3mueek32nnpxk FOREIGN KEY (user_detail_id) REFERENCES user_details(id)
   ) ENGINE=InnoDB;
    create table academic_records (
        year_of_passing integer,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        additional_notes varchar(255),
        degree varchar(255) not null,
        grade_or_percentage varchar(255),
        institution varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table government_documents (
        created_at datetime(6),
        file_size bigint,
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        document_type varchar(255) not null,
        file_name varchar(255) not null,
        file_type varchar(255),
        file_data LONGTEXT,
        primary key (id)
    ) engine=InnoDB;

    create table user_details (
        date_of_birth date,
        email_verified bit not null,
        is_primary bit,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_id bigint,
        city varchar(255),
        country varchar(255),
        first_name varchar(255),
        last_name varchar(255),
        password_reset_token varchar(255),
        pincode varchar(255),
        plot_number varchar(255),
        street_address varchar(255),
        verification_token varchar(255),
        gender enum ('MALE','FEMALE','OTHER'),
        primary key (id)
    ) engine=InnoDB;

    create table users (
        active bit not null,
        password_change_required bit not null,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        email varchar(255) not null,
        name varchar(255) not null,
        password varchar(255) not null,
        role varchar(255),
        primary key (id)
    ) engine=InnoDB;

    create table work_experiences (
        currently_working_here bit not null,
        end_date date,
        start_date date,
        created_at datetime(6),
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_detail_id bigint,
        achievements varchar(255),
        company_name varchar(255) not null,
        job_description varchar(255),
        job_title varchar(255) not null,
        skills_gained varchar(255),
        primary key (id)
    ) engine=InnoDB;

    alter table user_details 
       add constraint UK_f4pdcamta635qqbhgcyqvrg7f unique (user_id);

    alter table users 
       add constraint UK_6dotkott2kjsp8vw4d0m25fb7 unique (email);

    alter table academic_records 
       add constraint FKocx43cq4vipble6ryyyha7xhq 
       foreign key (user_detail_id) 
       references user_details (id);

    alter table government_documents 
       add constraint FKpqb6cu77ru9y3mueek32nnpxk 
       foreign key (user_detail_id) 
       references user_details (id);

    alter table user_details 
       add constraint FKicouhgavvmiiohc28mgk0kuj5 
       foreign key (user_id) 
       references users (id);

    alter table work_experiences 
       add constraint FK8panc3p0vbu8qs1gvnouf7gt3 
       foreign key (user_detail_id) 
       references user_details (id);
-- Create cafes table
CREATE TABLE IF NOT EXISTS cafes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    cafe_name VARCHAR(255) NOT NULL,
    description TEXT,
    email VARCHAR(255),
    phone VARCHAR(255),
    established_year INT,
    total_tables INT,
    seating_capacity INT,
    has_wifi BIT DEFAULT 0,
    has_parking BIT DEFAULT 0,
    has_ac BIT DEFAULT 0,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    street_address VARCHAR(255),
    plot_number VARCHAR(255),
    city VARCHAR(255),
    pincode VARCHAR(255),
    country VARCHAR(255) DEFAULT 'India',
    is_primary BIT DEFAULT 1,
    owner_id BIGINT UNIQUE,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT FK_cafes_owner FOREIGN KEY (owner_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- Create cafe_documents table
CREATE TABLE IF NOT EXISTS cafe_documents (
    id BIGINT NOT NULL AUTO_INCREMENT,
    cafe_id BIGINT,
    document_type VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(255),
    file_data LONGTEXT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT FK_cafe_docs_cafe FOREIGN KEY (cafe_id) REFERENCES cafes(id)
) ENGINE=InnoDB;

-- Create cafe_images table
CREATE TABLE IF NOT EXISTS cafe_images (
    id BIGINT NOT NULL AUTO_INCREMENT,
    cafe_id BIGINT,
    caption VARCHAR(255),
    is_primary BIT DEFAULT 0,
    file_name VARCHAR(255),
    file_size BIGINT,
    file_type VARCHAR(255),
    file_data LONGTEXT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT FK_cafe_images_cafe FOREIGN KEY (cafe_id) REFERENCES cafes(id)
) ENGINE=InnoDB;

-- Add available_tables column to table_types
ALTER TABLE table_types ADD COLUMN available_tables INT DEFAULT 0;

-- Add quantity column to bookings
ALTER TABLE bookings ADD COLUMN quantity INT DEFAULT 1;

-- Add customer_name and customer_phone to bookings
ALTER TABLE bookings ADD COLUMN customer_name VARCHAR(255);
ALTER TABLE bookings ADD COLUMN customer_phone VARCHAR(50);

-- Add is_walk_in column to bookings
ALTER TABLE bookings ADD COLUMN is_walk_in BOOLEAN DEFAULT FALSE;

-- Add OCCUPIED_WALKIN to booking status enum
-- This is handled by JPA EnumType.STRING

-- Create table_types table if not exists
CREATE TABLE IF NOT EXISTS table_types (
    id BIGINT NOT NULL AUTO_INCREMENT,
    cafe_id BIGINT,
    type_name VARCHAR(255) NOT NULL,
    description TEXT,
    table_count INT NOT NULL DEFAULT 0,
    available_tables INT NOT NULL DEFAULT 0,
    seating_capacity_per_table INT DEFAULT 4,
    minimum_order_amount DECIMAL(10,2) DEFAULT 0,
    price_per_hour DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT FK_table_types_cafe FOREIGN KEY (cafe_id) REFERENCES cafes(id)
) ENGINE=InnoDB;

-- Create bookings table if not exists
CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT NOT NULL AUTO_INCREMENT,
    cafe_id BIGINT,
    customer_id BIGINT,
    table_type_id BIGINT,
    start_time DATETIME(6),
    end_time DATETIME(6),
    reserved_until DATETIME(6),
    release_at DATETIME(6),
    status ENUM('REQUESTED', 'ACCEPTED', 'COMPLETED', 'REJECTED', 'OCCUPIED_WALKIN') DEFAULT 'REQUESTED',
    table_number INT,
    quantity INT DEFAULT 1,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    notes TEXT,
    is_walk_in BOOLEAN DEFAULT FALSE,
    created_at DATETIME(6),
    accepted_at DATETIME(6),
    completed_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT FK_bookings_cafe FOREIGN KEY (cafe_id) REFERENCES cafes(id),
    CONSTRAINT FK_bookings_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT FK_bookings_table_type FOREIGN KEY (table_type_id) REFERENCES table_types(id)
) ENGINE=InnoDB;

-- Add indexes for better performance
CREATE INDEX idx_table_types_cafe_id ON table_types(cafe_id);
CREATE INDEX idx_table_types_is_active ON table_types(is_active);
CREATE INDEX idx_bookings_cafe_id ON bookings(cafe_id);
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_table_type ON bookings(table_type_id);

-- Update existing table types with default prices if needed
UPDATE table_types 
SET price_per_hour = 500.00 
WHERE price_per_hour IS NULL OR price_per_hour = 0;

UPDATE table_types 
SET minimum_order_amount = 1000.00 
WHERE minimum_order_amount IS NULL OR minimum_order_amount = 0;

-- Update available tables if null
UPDATE table_types 
SET available_tables = COALESCE(available_tables, table_count, 0)
WHERE available_tables IS NULL;